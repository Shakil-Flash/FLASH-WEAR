import { NextResponse } from "next/server";
import { unsubscribeAbandonedCart } from "@/lib/services/abandoned-carts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  if (token) {
    await unsubscribeAbandonedCart(token);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.redirect(`${siteUrl}/unsubscribe?status=cart_unsubscribed`);
}
