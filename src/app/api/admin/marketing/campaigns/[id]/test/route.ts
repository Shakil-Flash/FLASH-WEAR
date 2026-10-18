import { NextResponse } from "next/server";
import { sendCampaignTestEmail } from "@/lib/services/marketing";
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

    const { testEmail } = await request.json();
    if (!testEmail || !testEmail.includes("@")) {
      return NextResponse.json({ error: "Valid testEmail is required" }, { status: 400 });
    }

    const result = await sendCampaignTestEmail(params.id, testEmail);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send test email" }, { status: 500 });
  }
}
