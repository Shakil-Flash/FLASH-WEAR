import { NextResponse } from "next/server";
import { validateReferralCode } from "@/lib/services/referrals";

export async function POST(request: Request) {
  try {
    const { code, email, phone, userId } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, message: "Referral code is required" }, { status: 400 });
    }

    const res = await validateReferralCode(
      code,
      userId || undefined,
      email || undefined,
      phone || undefined
    );

    if (!res.isValid) {
      return NextResponse.json({
        valid: false,
        message: res.error || "Invalid referral code",
      });
    }

    return NextResponse.json({
      valid: true,
      code: code.trim().toUpperCase(),
      discountAmount: res.discountAmount,
      message: `Referral code applied! You get ৳${res.discountAmount} off your order.`,
    });
  } catch (err: any) {
    console.error("Referral validation route error:", err);
    return NextResponse.json({ valid: false, message: "Validation error" }, { status: 500 });
  }
}
