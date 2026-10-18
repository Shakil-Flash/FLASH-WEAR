import { NextResponse } from "next/server";
import { getUserReferralStats } from "@/lib/services/referrals";
import { requireCustomer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const stats = await getUserReferralStats(auth.user.id);
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load referrals" }, { status: 500 });
  }
}
