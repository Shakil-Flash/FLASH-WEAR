import { NextResponse } from "next/server";
import { subscribeToStockOrPrice } from "@/lib/services/stock-subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, productId, variantId, subscriptionType, targetPrice, userId } = body;

    if (!email || !productId || !subscriptionType) {
      return NextResponse.json(
        { error: "Email, productId, and subscriptionType are required" },
        { status: 400 }
      );
    }

    const result = await subscribeToStockOrPrice({
      email,
      productId,
      variantId,
      subscriptionType,
      targetPrice,
      userId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create subscription" }, { status: 500 });
  }
}
