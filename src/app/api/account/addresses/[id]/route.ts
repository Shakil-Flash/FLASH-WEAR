import { NextResponse } from "next/server";
import { deleteCustomerAddress } from "@/lib/services/accounts";
import { requireCustomer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const addressId = params.id;
    const deleted = await deleteCustomerAddress(addressId, auth.user.id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
