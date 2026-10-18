import { NextResponse } from "next/server";
import { updateReturnRequestStatus, restockReturnedItems } from "@/lib/services/returns";
import { requireAdmin } from "@/lib/auth/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const returnId = params.id;
    const body = await request.json();
    const { action, status, adminNotes, inspectionOutcome, refundAmount, refundStatus } = body;

    // Handle restock action
    if (action === "restock") {
      const restockResult = await restockReturnedItems(returnId, adminNotes);
      if (!restockResult.success) {
        return NextResponse.json({ error: restockResult.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Returned items successfully restocked into inventory" });
    }

    if (status) {
      const updateResult = await updateReturnRequestStatus(returnId, status, {
        adminNotes,
        inspectionOutcome,
        refundAmount,
        refundStatus,
      });

      if (!updateResult.success) {
        return NextResponse.json({ error: updateResult.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: `Status updated to ${status}` });
    }

    return NextResponse.json({ error: "No valid action or status provided" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin return update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update return request" }, { status: 500 });
  }
}
