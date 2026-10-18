import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { NewsletterSubscriber, MarketingCampaign, CampaignStatus } from "../types";
import { sendEmail } from "../email/resend";

export const fallbackSubscribers: NewsletterSubscriber[] = [];
export const fallbackCampaigns: MarketingCampaign[] = [];

/**
 * Opt-in subscription to FLASHWEAR marketing newsletter
 */
export async function subscribeNewsletter(
  email: string,
  source: string = "storefront_footer",
  userId?: string | null
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, message: "A valid email address is required" };
  }

  const existing = fallbackSubscribers.find((s) => s.email === cleanEmail);
  if (existing) {
    if (existing.status === "active") {
      return { success: true, message: "You are already subscribed to the FLASHWEAR newsletter!" };
    }
    // Re-activate if previously unsubscribed
    existing.status = "active";
    existing.consent_given_at = new Date().toISOString();
    existing.unsubscribed_at = null;
    return { success: true, message: "Welcome back! Your subscription has been re-activated." };
  }

  const token = `unsub_nl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const record: NewsletterSubscriber = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email: cleanEmail,
    user_id: userId || null,
    source,
    status: "active",
    consent_given_at: new Date().toISOString(),
    unsubscribed_at: null,
    unsubscribe_token: token,
    created_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin.from("newsletter_subscribers").upsert(record, { onConflict: "email" });
    } catch (err) {
      console.warn("DB insert subscriber error:", err);
    }
  }

  fallbackSubscribers.unshift(record);
  return { success: true, message: "Thank you for subscribing to FLASHWEAR drops & promotions!" };
}

/**
 * Unsubscribe from newsletter using security token
 */
export async function unsubscribeNewsletter(token: string): Promise<boolean> {
  const sub = fallbackSubscribers.find((s) => s.unsubscribe_token === token);
  if (sub) {
    sub.status = "unsubscribed";
    sub.unsubscribed_at = new Date().toISOString();
  }

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token);
    } catch {}
  }

  return true;
}

/**
 * Get subscriber statistics and list for admin
 */
export async function getSubscribersList(): Promise<{
  total: number;
  active: number;
  unsubscribed: number;
  subscribers: NewsletterSubscriber[];
}> {
  let list = fallbackSubscribers;

  if (isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) list = data as NewsletterSubscriber[];
    } catch {}
  }

  const active = list.filter((s) => s.status === "active").length;
  const unsubscribed = list.filter((s) => s.status === "unsubscribed").length;

  return {
    total: list.length,
    active,
    unsubscribed,
    subscribers: list,
  };
}

/**
 * Get all marketing campaigns
 */
export async function getMarketingCampaigns(): Promise<MarketingCampaign[]> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data as MarketingCampaign[];
    } catch {}
  }
  return fallbackCampaigns;
}

/**
 * Create a new campaign draft
 */
export async function createMarketingCampaign(input: {
  title: string;
  subject: string;
  previewText?: string;
  contentHtml: string;
  targetSegment?: string;
}): Promise<MarketingCampaign> {
  const campaign: MarketingCampaign = {
    id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    subject: input.subject,
    preview_text: input.previewText || null,
    content_html: input.contentHtml,
    target_segment: input.targetSegment || "all_subscribers",
    status: "draft",
    recipient_count: 0,
    sent_count: 0,
    failed_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("marketing_campaigns")
        .insert(campaign)
        .select()
        .single();
      if (!error && data) {
        return data as MarketingCampaign;
      }
    } catch (err) {
      console.warn("DB insert campaign error:", err);
    }
  }

  fallbackCampaigns.unshift(campaign);
  return campaign;
}

/**
 * Send test preview email to an admin
 */
export async function sendCampaignTestEmail(
  campaignId: string,
  testRecipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  let campaign = fallbackCampaigns.find((c) => c.id === campaignId);
  if (!campaign && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("marketing_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
      if (data) campaign = data as MarketingCampaign;
    } catch {}
  }

  if (!campaign) {
    return { success: false, error: "Campaign not found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const html = `
    <div style="border-bottom: 2px solid #f59e0b; padding: 12px; background: #1c1917; color: #f59e0b; font-size: 12px; text-transform: uppercase; font-family: monospace;">
      [TEST PREVIEW] Subject: ${campaign.subject}
    </div>
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0e; color: #f4f4f5; padding: 32px; border-radius: 8px;">
      <div style="margin-bottom: 24px; text-align: center;">
        <span style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ccff00;">FLASHWEAR</span>
      </div>
      <div>${campaign.content_html}</div>
      <p style="font-size: 11px; color: #71717a; text-align: center; margin-top: 32px;">
        This is a test preview sent to ${testRecipientEmail}.<br/>
        <a href="${siteUrl}/unsubscribe" style="color: #a1a1aa; text-decoration: underline;">Test Unsubscribe Link</a>
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: testRecipientEmail,
      subject: `[TEST] ${campaign.subject}`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch campaign to active consented subscribers in bounded batches
 */
export async function dispatchMarketingCampaign(
  campaignId: string
): Promise<{ success: boolean; sentCount: number; failedCount: number; error?: string }> {
  let campaign = fallbackCampaigns.find((c) => c.id === campaignId);
  if (!campaign && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("marketing_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
      if (data) campaign = data as MarketingCampaign;
    } catch {}
  }

  if (!campaign) {
    return { success: false, sentCount: 0, failedCount: 0, error: "Campaign not found" };
  }

  // Get active subscribers
  const { subscribers } = await getSubscribersList();
  const activeSubscribers = subscribers.filter((s) => s.status === "active");

  campaign.status = "sending";
  campaign.recipient_count = activeSubscribers.length;

  let sent = 0;
  let failed = 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  for (const subscriber of activeSubscribers) {
    const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0e; color: #f4f4f5; padding: 32px; border-radius: 8px;">
        <div style="margin-bottom: 24px; text-align: center;">
          <span style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ccff00;">FLASHWEAR</span>
        </div>
        <div>${campaign.content_html}</div>
        <p style="font-size: 11px; color: #71717a; text-align: center; margin-top: 32px;">
          You received this email because you subscribed to updates on FLASHWEAR.<br/>
          <a href="${unsubUrl}" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe from marketing emails</a>
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: subscriber.email,
        subject: campaign.subject,
        html: emailHtml,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  campaign.status = "sent";
  campaign.sent_count = sent;
  campaign.failed_count = failed;
  campaign.sent_at = new Date().toISOString();
  campaign.updated_at = new Date().toISOString();

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("marketing_campaigns")
        .update({
          status: "sent",
          recipient_count: activeSubscribers.length,
          sent_count: sent,
          failed_count: failed,
          sent_at: campaign.sent_at,
          updated_at: campaign.updated_at,
        })
        .eq("id", campaign.id);
    } catch {}
  }

  return { success: true, sentCount: sent, failedCount: failed };
}
