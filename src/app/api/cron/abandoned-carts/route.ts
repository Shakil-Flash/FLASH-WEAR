import { NextResponse } from "next/server";
import { processAbandonedCartReminders } from "@/lib/services/abandoned-carts";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Only allow in development or local test when secret is unconfigured
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.replace(/^Bearer\s+/i, "") === cronSecret) {
    return true;
  }

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === cronSecret) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processAbandonedCartReminders(25);
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process reminders" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processAbandonedCartReminders(25);
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process reminders" }, { status: 500 });
  }
}
