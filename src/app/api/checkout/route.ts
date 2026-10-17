import { NextResponse } from "next/server";
import { createGuestOrder } from "@/lib/services/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createGuestOrder(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Order creation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      receiptToken: result.receiptToken,
      orderId: result.orderId,
      isDuplicate: result.isDuplicate,
    });
  } catch (err: any) {
    console.error("Checkout route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error occurred" },
      { status: 500 }
    );
  }
}
