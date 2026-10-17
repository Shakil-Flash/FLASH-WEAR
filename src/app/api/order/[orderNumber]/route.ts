import { NextResponse } from "next/server";
import { getOrderByNumberAndToken } from "@/lib/services/orders";

export async function GET(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Access denied. Valid receipt token is required." },
        { status: 403 }
      );
    }

    const order = await getOrderByNumberAndToken(params.orderNumber, token);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found or access token invalid." },
        { status: 404 }
      );
    }

    // Return safe customer order view (omit internal notes)
    const safeOrder = {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      division: order.division,
      district: order.district,
      deliveryAddress: order.delivery_address,
      orderNotes: order.order_notes,
      paymentMethod: order.payment_method,
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      totalAmount: order.total_amount,
      status: order.status,
      trackingNumber: order.tracking_number,
      createdAt: order.created_at,
      items: order.items?.map((item) => ({
        productName: item.product_name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        unitPrice: item.unit_price,
        quantity: item.quantity,
        lineTotal: item.line_total,
        productImageUrl: item.product_image_url,
      })),
    };

    return NextResponse.json({ order: safeOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
