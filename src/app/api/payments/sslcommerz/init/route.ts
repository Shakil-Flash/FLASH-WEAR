import { NextResponse } from "next/server";
import { getOrderById, getOrderByNumber } from "@/lib/services/orders";
import { initiateSSLCommerzPayment } from "@/lib/payments/sslcommerz";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, orderNumber } = body;

    let order = null;
    if (orderId) {
      order = await getOrderById(orderId);
    } else if (orderNumber) {
      order = await getOrderByNumber(orderNumber);
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json(
        { error: "Order is already paid" },
        { status: 400 }
      );
    }

    const initResult = await initiateSSLCommerzPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
      division: order.division,
      district: order.district,
    });

    if (!initResult.success) {
      return NextResponse.json(
        { error: initResult.error || "Failed to initialize payment gateway" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectUrl: initResult.redirectUrl,
      tranId: initResult.tranId,
    });
  } catch (err: any) {
    console.error("Payment init error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process payment initialization" },
      { status: 500 }
    );
  }
}
