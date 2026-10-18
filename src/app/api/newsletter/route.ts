import { NextResponse } from "next/server";
import { subscribeNewsletter } from "@/lib/services/marketing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, source, userId } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const result = await subscribeNewsletter(email, source || "storefront_footer", userId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to subscribe" }, { status: 500 });
  }
}

