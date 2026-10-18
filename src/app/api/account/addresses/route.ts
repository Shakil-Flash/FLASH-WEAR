import { NextResponse } from "next/server";
import { getCustomerAddresses, addCustomerAddress } from "@/lib/services/accounts";
import { requireCustomer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const addresses = await getCustomerAddresses(auth.user.id);
    return NextResponse.json(addresses);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const body = await request.json();
    const { userId: _ignored, ...addressData } = body;

    if (!addressData.full_name || !addressData.phone || !addressData.address_line) {
      return NextResponse.json({ error: "Missing required address fields" }, { status: 400 });
    }

    const created = await addCustomerAddress(auth.user.id, addressData);
    return NextResponse.json({ success: true, address: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
