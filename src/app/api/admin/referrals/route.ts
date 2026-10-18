import { NextResponse } from "next/server";
import {
  getReferralSettings,
  updateReferralSettings,
  getAdminReferralsList,
} from "@/lib/services/referrals";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [settings, referrals] = await Promise.all([
      getReferralSettings(),
      getAdminReferralsList(),
    ]);

    return NextResponse.json({
      settings,
      referrals,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load referrals" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const updated = await updateReferralSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update referral settings" }, { status: 500 });
  }
}
