import { NextResponse } from "next/server";
import {
  getLoyaltySettings,
  updateLoyaltySettings,
  adjustLoyaltyPointsAdmin,
  fallbackLoyaltyLedger,
} from "@/lib/services/loyalty";

import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await getLoyaltySettings();
    return NextResponse.json({
      settings,
      recentLedger: fallbackLoyaltyLedger.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load loyalty settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const updated = await updateLoyaltySettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update loyalty settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { targetUserId, points, reason, adminActor } = body;

    if (!targetUserId || !points || !reason) {
      return NextResponse.json(
        { error: "targetUserId, points, and reason are required" },
        { status: 400 }
      );
    }

    const result = await adjustLoyaltyPointsAdmin(
      adminActor || "admin@flashwear.store",
      targetUserId,
      Number(points),
      reason
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Adjustment failed" }, { status: 500 });
  }
}
