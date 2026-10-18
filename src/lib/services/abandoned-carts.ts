import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { AbandonedCart, CartItem } from "../types";
import { sendEmail } from "../email/resend";
import { getProductBySlug } from "./catalog";

export const fallbackAbandonedCarts: AbandonedCart[] = [];

export interface SaveCartInput {
  recoveryToken?: string;
  userId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  cartItems: CartItem[];
  subtotal: number;
  discountCode?: string | null;
  marketingConsent?: boolean;
}

/**
 * Save or update an in-progress cart session
 */
export async function saveAbandonedCart(
  input: SaveCartInput
): Promise<{ success: boolean; recoveryToken: string }> {
  if (!input.cartItems || input.cartItems.length === 0) {
    return { success: false, recoveryToken: "" };
  }

  const recoveryToken =
    input.recoveryToken ||
    `cart_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const cartRecord: AbandonedCart = {
    id: `ac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recovery_token: recoveryToken,
    user_id: input.userId || null,
    customer_email: input.customerEmail || null,
    customer_phone: input.customerPhone || null,
    customer_name: input.customerName || null,
    cart_items: input.cartItems,
    subtotal: input.subtotal,
    discount_code: input.discountCode || null,
    status: "active",
    reminder_count: 0,
    marketing_consent: input.marketingConsent ?? true,
    unsubscribed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin.from("abandoned_carts").upsert(cartRecord, {
        onConflict: "recovery_token",
      });
    } catch (err) {
      console.warn("DB save abandoned cart error:", err);
    }
  }

  // Update in-memory fallback
  const existingIdx = fallbackAbandonedCarts.findIndex((c) => c.recovery_token === recoveryToken);
  if (existingIdx >= 0) {
    fallbackAbandonedCarts[existingIdx] = cartRecord;
  } else {
    fallbackAbandonedCarts.unshift(cartRecord);
  }

  return { success: true, recoveryToken };
}

/**
 * Retrieve cart by recovery token and revalidate current prices and inventory
 */
export async function getAndRevalidateRecoveredCart(recoveryToken: string): Promise<{
  cart: AbandonedCart | null;
  revalidatedItems: CartItem[];
  hasPriceChanges: boolean;
  hasOutOfStockItems: boolean;
}> {
  let cart: AbandonedCart | null =
    fallbackAbandonedCarts.find((c) => c.recovery_token === recoveryToken) || null;

  if (!cart && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("abandoned_carts")
        .select("*")
        .eq("recovery_token", recoveryToken)
        .maybeSingle();
      if (data) cart = data as AbandonedCart;
    } catch (err) {
      console.warn("DB fetch abandoned cart error:", err);
    }
  }

  if (!cart) {
    return {
      cart: null,
      revalidatedItems: [],
      hasPriceChanges: false,
      hasOutOfStockItems: false,
    };
  }

  let hasPriceChanges = false;
  let hasOutOfStockItems = false;
  const revalidatedItems: CartItem[] = [];

  for (const item of cart.cart_items) {
    try {
      const product = await getProductBySlug(item.productSlug);
      if (!product || !product.is_published) {
        hasOutOfStockItems = true;
        continue;
      }

      const variant = product.variants?.find((v) => v.id === item.variantId);
      if (!variant || variant.inventory_quantity <= 0) {
        hasOutOfStockItems = true;
        continue;
      }

      if (product.price !== item.unitPrice) {
        hasPriceChanges = true;
      }

      const availableQty = Math.min(item.quantity, variant.inventory_quantity);
      revalidatedItems.push({
        ...item,
        unitPrice: product.price,
        maxInventory: variant.inventory_quantity,
        quantity: availableQty,
      });
    } catch {
      revalidatedItems.push(item);
    }
  }

  return {
    cart,
    revalidatedItems,
    hasPriceChanges,
    hasOutOfStockItems,
  };
}

/**
 * Mark cart recovered when customer completes checkout
 */
export async function markCartRecovered(
  recoveryToken: string,
  orderId: string
): Promise<boolean> {
  let cart = fallbackAbandonedCarts.find((c) => c.recovery_token === recoveryToken);

  if (cart) {
    cart.status = "recovered";
    cart.recovered_order_id = orderId;
    cart.recovered_at = new Date().toISOString();
    cart.updated_at = new Date().toISOString();
  }

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("abandoned_carts")
        .update({
          status: "recovered",
          recovered_order_id: orderId,
          recovered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("recovery_token", recoveryToken);
    } catch (err) {
      console.warn("DB update cart recovered error:", err);
    }
  }

  return true;
}

/**
 * Unsubscribe customer from abandoned cart reminders
 */
export async function unsubscribeAbandonedCart(recoveryToken: string): Promise<boolean> {
  const cart = fallbackAbandonedCarts.find((c) => c.recovery_token === recoveryToken);
  if (cart) {
    cart.unsubscribed = true;
    cart.updated_at = new Date().toISOString();
  }

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("abandoned_carts")
        .update({ unsubscribed: true, updated_at: new Date().toISOString() })
        .eq("recovery_token", recoveryToken);
    } catch {}
  }

  return true;
}

/**
 * Process abandoned cart reminder emails in a bounded, idempotent batch
 */
export async function processAbandonedCartReminders(
  batchLimit: number = 25
): Promise<{
  processedCount: number;
  sentCount: number;
  skippedCount: number;
  errors: string[];
}> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let eligibleCarts: AbandonedCart[] = [];

  if (isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("abandoned_carts")
        .select("*")
        .eq("status", "active")
        .eq("unsubscribed", false)
        .eq("marketing_consent", true)
        .lt("created_at", oneHourAgo)
        .lt("reminder_count", 2)
        .limit(batchLimit);

      if (data) eligibleCarts = data as AbandonedCart[];
    } catch (err) {
      console.warn("DB fetch eligible abandoned carts error:", err);
    }
  }

  // Fallback to in-memory check
  if (eligibleCarts.length === 0) {
    eligibleCarts = fallbackAbandonedCarts
      .filter(
        (c) =>
          c.status === "active" &&
          !c.unsubscribed &&
          c.marketing_consent &&
          Boolean(c.customer_email) &&
          c.reminder_count < 2 &&
          new Date(c.created_at).getTime() < Date.now() - 60 * 60 * 1000
      )
      .slice(0, batchLimit);
  }

  let sentCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const cart of eligibleCarts) {
    if (!cart.customer_email) {
      skippedCount++;
      continue;
    }

    // If second reminder, ensure 24 hours elapsed since first reminder
    if (cart.reminder_count === 1 && cart.last_reminder_at) {
      if (new Date(cart.last_reminder_at).getTime() > new Date(twentyFourHoursAgo).getTime()) {
        skippedCount++;
        continue;
      }
    }

    const recoveryLink = `${siteUrl}/cart?recover=${cart.recovery_token}`;
    const unsubscribeLink = `${siteUrl}/api/cart/unsubscribe?token=${cart.recovery_token}`;
    const itemsListHtml = cart.cart_items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #27272a;">
          <td style="padding: 12px 0;">
            <strong style="color: #ffffff; font-size: 14px;">${item.productName}</strong><br/>
            <span style="color: #a1a1aa; font-size: 12px;">Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 12px 0; text-align: right; color: #ccff00; font-weight: 700;">
            ৳${(item.unitPrice * item.quantity).toLocaleString()}
          </td>
        </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0c0e; color: #f4f4f5; padding: 32px; border-radius: 8px;">
        <h1 style="color: #ccff00; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">You left items in your cart</h1>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5;">Hey ${cart.customer_name || "Streetwear Fan"}, your selected FLASHWEAR pieces are waiting for you, but inventory is limited.</p>
        
        <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${recoveryLink}" style="background: #ccff00; color: #000000; padding: 14px 28px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; display: inline-block;">Resume Checkout Now →</a>
        </div>

        <p style="font-size: 11px; color: #71717a; text-align: center; margin-top: 32px;">
          You received this because you entered your email at checkout with marketing preferences enabled.<br/>
          <a href="${unsubscribeLink}" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe from cart reminders</a>
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: cart.customer_email,
        subject: "Your FLASHWEAR cart is saved — Complete your order",
        html: emailHtml,
      });

      // Update reminder state
      cart.reminder_count += 1;
      cart.last_reminder_at = new Date().toISOString();
      cart.updated_at = new Date().toISOString();

      if (isServiceRoleConfigured()) {
        await supabaseAdmin
          .from("abandoned_carts")
          .update({
            reminder_count: cart.reminder_count,
            last_reminder_at: cart.last_reminder_at,
            updated_at: cart.updated_at,
          })
          .eq("id", cart.id);
      }

      sentCount++;
    } catch (err: any) {
      errors.push(`Failed sending to ${cart.customer_email}: ${err.message}`);
    }
  }

  return {
    processedCount: eligibleCarts.length,
    sentCount,
    skippedCount,
    errors,
  };
}
