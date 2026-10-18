import { NextResponse } from "next/server";
import { updateAdminOrderStatus, cancelOrderAndRestoreStock } from "@/lib/services/orders";
import { requireAdmin } from "@/lib/auth/server";

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { orderId, action, status, trackingNumber, adminNotes } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    if (action === "cancel") {
      const res = await cancelOrderAndRestoreStock(orderId, adminNotes);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Order cancelled and inventory restored." });
    }

    if (status !== undefined || trackingNumber !== undefined || adminNotes !== undefined) {
      const res = await updateAdminOrderStatus(orderId, status, trackingNumber, adminNotes);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Order updated successfully." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
