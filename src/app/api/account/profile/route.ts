import { NextResponse } from "next/server";
import { getCustomerProfile, updateCustomerProfile } from "@/lib/services/accounts";
import { requireCustomer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const userId = auth.user.id;
    const profile = await getCustomerProfile(userId);
    return NextResponse.json(
      profile || { id: userId, email: auth.user.email || "customer@flashwear.store", full_name: "Customer" }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const body = await request.json();
    const { fullName, phone } = body;

    const updated = await updateCustomerProfile(auth.user.id, { fullName, phone });
    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
