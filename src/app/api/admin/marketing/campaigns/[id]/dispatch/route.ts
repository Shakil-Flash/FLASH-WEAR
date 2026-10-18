import { NextResponse } from "next/server";
import { dispatchMarketingCampaign } from "@/lib/services/marketing";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const result = await dispatchMarketingCampaign(params.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to dispatch campaign" }, { status: 500 });
  }
}
