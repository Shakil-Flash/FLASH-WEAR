import { NextResponse } from "next/server";
import { getAndRevalidateRecoveredCart } from "@/lib/services/abandoned-carts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Recovery token is required" }, { status: 400 });
    }

    const result = await getAndRevalidateRecoveredCart(token);
    if (!result.cart) {
      return NextResponse.json({ error: "Cart session not found or expired" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to recover cart" }, { status: 500 });
  }
}
