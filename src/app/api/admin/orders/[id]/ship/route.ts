import { NextResponse } from "next/server";
import { getOrderById, updateOrderShipment } from "@/lib/services/orders";
import { bookOrderShipment } from "@/lib/shipping/courier";
import { requireAdmin } from "@/lib/auth/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const orderId = params.id;
    const body = await request.json();
    const { courierName = "Pathao Courier", specialInstruction } = body;

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine COD amount: 0 if online payment was paid, otherwise order.total_amount
    const codAmount = order.payment_status === "paid" ? 0 : order.total_amount;
    const totalItemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;

    const shipmentResult = await bookOrderShipment(order.id, courierName, {
      orderId: order.id,
      orderNumber: order.order_number,
      recipientName: order.customer_name,
      recipientPhone: order.customer_phone,
      recipientAddress: order.delivery_address,
      recipientCity: order.district,
      recipientZone: order.division,
      deliveryFee: order.delivery_fee,
      codAmount,
      itemQuantity: totalItemsCount,
      specialInstruction,
    });

    if (!shipmentResult.success || !shipmentResult.consignmentId) {
      return NextResponse.json(
        { error: shipmentResult.error || "Failed to create shipment" },
        { status: 400 }
      );
    }

    // Update order with consignment and shipment status
    await updateOrderShipment(order.id, {
      courierName: shipmentResult.courierName,
      consignmentId: shipmentResult.consignmentId,
      trackingUrl: shipmentResult.trackingUrl,
      shipmentStatus: shipmentResult.status,
    });

    return NextResponse.json({
      success: true,
      shipment: shipmentResult,
    });
  } catch (err: any) {
    console.error("Shipping action error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process shipment booking" },
      { status: 500 }
    );
  }
}
