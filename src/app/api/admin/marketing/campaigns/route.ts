import { NextResponse } from "next/server";
import { getMarketingCampaigns, createMarketingCampaign } from "@/lib/services/marketing";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const campaigns = await getMarketingCampaigns();
    return NextResponse.json({ campaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const body = await request.json();
    const { title, subject, previewText, contentHtml, targetSegment } = body;

    if (!title || !subject || !contentHtml) {
      return NextResponse.json(
        { error: "Title, subject, and contentHtml are required" },
        { status: 400 }
      );
    }

    const campaign = await createMarketingCampaign({
      title,
      subject,
      previewText,
      contentHtml,
      targetSegment,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create campaign" }, { status: 500 });
  }
}
