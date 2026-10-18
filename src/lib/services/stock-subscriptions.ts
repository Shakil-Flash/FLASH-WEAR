import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { StockPriceSubscription, SubscriptionType } from "../types";
import { sendEmail } from "../email/resend";
import { getAllProducts, getProductById } from "./catalog";

export const fallbackSubscriptions: StockPriceSubscription[] = [];

export interface SubscribeInput {
  email: string;
  productId: string;
  variantId?: string | null;
  subscriptionType: SubscriptionType;
  targetPrice?: number | null;
  userId?: string | null;
}

/**
 * Subscribe customer to back-in-stock or price-drop notifications
 */
export async function subscribeToStockOrPrice(
  input: SubscribeInput
): Promise<{ success: boolean; subscriptionId: string; message: string }> {
  const email = (input.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, subscriptionId: "", message: "A valid email address is required" };
  }

  // Deduplication check
  const existing = fallbackSubscriptions.find(
    (s) =>
      s.email === email &&
      s.product_id === input.productId &&
      (input.variantId ? s.variant_id === input.variantId : true) &&
      s.subscription_type === input.subscriptionType &&
      s.status === "pending"
  );

  if (existing) {
    return {
      success: true,
      subscriptionId: existing.id,
      message: "You are already subscribed to notifications for this item",
    };
  }

  // Get current price
  let currentPrice: number | null = null;
  try {
    const product = await getProductById(input.productId);
    if (product) {
      currentPrice = product.price;
    }
  } catch {}

  const unsubscribeToken = `unsub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const record: StockPriceSubscription = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: input.userId || null,
    email,
    product_id: input.productId,
    variant_id: input.variantId || null,
    subscription_type: input.subscriptionType,
    target_price: input.targetPrice || null,
    current_price_at_sub: currentPrice,
    status: "pending",
    unsubscribe_token: unsubscribeToken,
    created_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin.from("stock_price_subscriptions").insert(record);
    } catch (err) {
      console.warn("DB insert subscription error:", err);
    }
  }

  fallbackSubscriptions.unshift(record);

  return {
    success: true,
    subscriptionId: record.id,
    message:
      input.subscriptionType === "back_in_stock"
        ? "We'll notify you as soon as this item is back in stock!"
        : "We'll notify you when the price drops!",
  };
}

/**
 * Unsubscribe from notifications via token
 */
export async function unsubscribeStockSubscription(token: string): Promise<boolean> {
  const sub = fallbackSubscriptions.find((s) => s.unsubscribe_token === token);
  if (sub) {
    sub.status = "cancelled";
  }

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("stock_price_subscriptions")
        .update({ status: "cancelled" })
        .eq("unsubscribe_token", token);
    } catch {}
  }

  return true;
}

/**
 * Check active subscriptions against current inventory and price drops, then notify
 */
export async function checkAndNotifySubscribers(): Promise<{
  notifiedCount: number;
  errors: string[];
}> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let pendingSubs: StockPriceSubscription[] = [];

  if (isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("stock_price_subscriptions")
        .select("*, products(*)")
        .eq("status", "pending");
      if (data) pendingSubs = data as StockPriceSubscription[];
    } catch {}
  }

  if (pendingSubs.length === 0) {
    pendingSubs = fallbackSubscriptions.filter((s) => s.status === "pending");
  }

  let notifiedCount = 0;
  const errors: string[] = [];

  for (const sub of pendingSubs) {
    try {
      const product = await getProductById(sub.product_id);
      if (!product || !product.is_published) continue;

      let shouldNotify = false;
      let notificationSubject = "";
      let notificationBody = "";

      if (sub.subscription_type === "back_in_stock") {
        let isAvailable = false;
        if (sub.variant_id) {
          const variant = product.variants?.find((v: any) => v.id === sub.variant_id);
          if (variant && variant.inventory_quantity > 0) isAvailable = true;
        } else {
          const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0;
          if (totalStock > 0) isAvailable = true;
        }

        if (isAvailable) {
          shouldNotify = true;
          notificationSubject = `Back in Stock: ${product.name} is now available!`;
          notificationBody = `Great news! The item you've been waiting for is back in stock at FLASHWEAR. Grab yours before it sells out again.`;
        }
      } else if (sub.subscription_type === "price_drop") {
        const hasDropped =
          (sub.target_price && product.price <= sub.target_price) ||
          (sub.current_price_at_sub && product.price < sub.current_price_at_sub);

        if (hasDropped) {
          shouldNotify = true;
          notificationSubject = `Price Drop Alert: ${product.name} is now ৳${product.price.toLocaleString()}!`;
          notificationBody = `An item on your watchlist just dropped in price to ৳${product.price.toLocaleString()}. Don't miss out on this deal!`;
        }
      }

      if (shouldNotify) {
        const productUrl = `${siteUrl}/product/${product.slug}`;
        const unsubUrl = `${siteUrl}/api/subscriptions/unsubscribe?token=${sub.unsubscribe_token}`;

        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0e; color: #f4f4f5; padding: 32px; border-radius: 8px;">
            <h1 style="color: #ccff00; font-size: 22px; text-transform: uppercase; margin-bottom: 12px;">${notificationSubject}</h1>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${notificationBody}</p>

            <div style="background: #18181b; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 4px;">${product.name}</h2>
              <p style="color: #ccff00; font-size: 20px; font-weight: 800; margin: 0;">৳${product.price.toLocaleString()}</p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${productUrl}" style="background: #ccff00; color: #000000; padding: 14px 28px; text-decoration: none; font-weight: 800; text-transform: uppercase; border-radius: 4px; display: inline-block;">Shop Now →</a>
            </div>

            <p style="font-size: 11px; color: #71717a; text-align: center; margin-top: 32px;">
              You requested this alert on FLASHWEAR.<br/>
              <a href="${unsubUrl}" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe from this notification</a>
            </p>
          </div>
        `;

        await sendEmail({
          to: sub.email,
          subject: notificationSubject,
          html,
        });

        // Update status
        sub.status = "notified";
        sub.notified_at = new Date().toISOString();

        if (isServiceRoleConfigured()) {
          await supabaseAdmin
            .from("stock_price_subscriptions")
            .update({ status: "notified", notified_at: sub.notified_at })
            .eq("id", sub.id);
        }

        notifiedCount++;
      }
    } catch (err: any) {
      errors.push(`Error notifying ${sub.email}: ${err.message}`);
    }
  }

  return { notifiedCount, errors };
}

/**
 * Admin stats for subscriptions
 */
export async function getAdminSubscriptionStats() {
  let list = fallbackSubscriptions;
  if (isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin.from("stock_price_subscriptions").select("*");
      if (data) list = data as StockPriceSubscription[];
    } catch {}
  }

  const total = list.length;
  const pending = list.filter((s) => s.status === "pending").length;
  const notified = list.filter((s) => s.status === "notified").length;
  const backInStock = list.filter((s) => s.subscription_type === "back_in_stock").length;
  const priceDrop = list.filter((s) => s.subscription_type === "price_drop").length;

  return {
    total,
    pending,
    notified,
    backInStock,
    priceDrop,
    subscriptions: list,
  };
}
