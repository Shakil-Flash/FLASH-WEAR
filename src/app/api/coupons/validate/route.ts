import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/services/coupons";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotal, email, userId } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    const numSubtotal = Number(subtotal) || 0;
    const result = await validateCoupon(code, numSubtotal, email, userId);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return NextResponse.json(
      { valid: false, message: err.message || "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
