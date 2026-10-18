import { NextResponse } from "next/server";
import { getUserLoyaltyBalance, getUserLoyaltyLedger, getLoyaltySettings } from "@/lib/services/loyalty";
import { requireCustomer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const userId = auth.user.id;
    const [settings, balance, ledger] = await Promise.all([
      getLoyaltySettings(),
      getUserLoyaltyBalance(userId),
      getUserLoyaltyLedger(userId),
    ]);

    return NextResponse.json({
      settings,
      balance,
      ledger,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load rewards" }, { status: 500 });
  }
}
