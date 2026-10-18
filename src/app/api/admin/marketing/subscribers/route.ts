import { NextResponse } from "next/server";
import { getSubscribersList } from "@/lib/services/marketing";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const data = await getSubscribersList();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load subscribers" }, { status: 500 });
  }
}
