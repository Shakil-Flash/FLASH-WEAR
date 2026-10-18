import { NextResponse } from "next/server";
import { getOrderByNumber, updateOrderShipment } from "@/lib/services/orders";
import { ShipmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Normalizes courier status strings from Pathao, Steadfast, or RedX to standard ShipmentStatus
 */
function normalizeCourierStatus(statusStr: string): ShipmentStatus {
  const s = (statusStr || "").toLowerCase().trim();

  if (s.includes("deliver") || s.includes("payment_collected") || s.includes("completed")) {
    return "delivered";
  }
  if (s.includes("transit") || s.includes("pickup") || s.includes("dispatched") || s.includes("on_hold")) {
    return "in_transit";
  }
  if (s.includes("return")) {
    return "returned_to_sender";
  }
  if (s.includes("cancel")) {
    return "cancelled";
  }
  return "accepted_by_courier";
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("token");
    const headerToken = request.headers.get("x-courier-token") || request.headers.get("x-webhook-secret");

    // Optional webhook secret verification if configured
    const courierSecret = process.env.PATHAO_CLIENT_SECRET || process.env.CRON_SECRET;
    if (courierSecret) {
      if (queryToken !== courierSecret && headerToken !== courierSecret) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid courier webhook secret" },
          { status: 401 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const consignmentId = body.consignment_id || body.consignmentId || body.tracking_code;
    const orderNumber = body.merchant_order_id || body.order_number || body.orderNumber;
    const rawStatus = body.order_status || body.status || body.event;

    if (!orderNumber && !consignmentId) {
      return NextResponse.json(
        { error: "Missing merchant_order_id or consignment_id in payload" },
        { status: 400 }
      );
    }

    if (!rawStatus) {
      return NextResponse.json(
        { error: "Missing status field in payload" },
        { status: 400 }
      );
    }

    // Resolve order
    let order = null;
    if (orderNumber) {
      order = await getOrderByNumber(orderNumber);
    }

    if (!order) {
      return NextResponse.json(
        { received: true, message: "Order not found in registry; webhook acknowledged" },
        { status: 200 }
      );
    }

    const shipmentStatus = normalizeCourierStatus(rawStatus);

    await updateOrderShipment(order.id, {
      courierName: order.courier_name || "Pathao Courier",
      consignmentId: consignmentId || order.courier_consignment_id || `CON-${order.order_number}`,
      trackingUrl: order.courier_tracking_url || undefined,
      shipmentStatus,
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      shipmentStatus,
      processedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Courier webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process courier webhook" },
      { status: 500 }
    );
  }
}
