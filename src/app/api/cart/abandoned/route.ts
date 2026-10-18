import { NextResponse } from "next/server";
import { saveAbandonedCart } from "@/lib/services/abandoned-carts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveAbandonedCart({
      recoveryToken: body.recoveryToken,
      userId: body.userId,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerName: body.customerName,
      cartItems: body.cartItems || [],
      subtotal: body.subtotal || 0,
      discountCode: body.discountCode,
      marketingConsent: body.marketingConsent ?? true,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record cart" }, { status: 500 });
  }
}
