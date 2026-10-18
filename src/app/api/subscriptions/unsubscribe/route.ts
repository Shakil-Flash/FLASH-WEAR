import { NextResponse } from "next/server";
import { unsubscribeStockSubscription } from "@/lib/services/stock-subscriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  if (token) {
    await unsubscribeStockSubscription(token);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.redirect(`${siteUrl}/unsubscribe?status=subscription_cancelled`);
}
