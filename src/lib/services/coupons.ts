import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { Coupon, CouponRedemption } from "../types";

// In-memory fallback coupons for local development and offline testing
export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "cpn-flash10",
    code: "FLASH10",
    description: "10% off on all streetwear orders above ৳1,000",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 1000,
    max_discount_amount: 500,
    usage_limit: 500,
    used_count: 14,
    per_customer_limit: 2,
    is_active: true,
    starts_at: "2026-01-01T00:00:00Z",
    expires_at: "2026-12-31T23:59:59Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cpn-welcome200",
    code: "WELCOME200",
    description: "৳200 flat discount on orders above ৳2,000",
    discount_type: "fixed",
    discount_value: 200,
    min_order_amount: 2000,
    max_discount_amount: null,
    usage_limit: 1000,
    used_count: 48,
    per_customer_limit: 1,
    is_active: true,
    starts_at: "2026-01-01T00:00:00Z",
    expires_at: "2026-12-31T23:59:59Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cpn-vip500",
    code: "VIP500",
    description: "৳500 flat discount on orders above ৳4,000",
    discount_type: "fixed",
    discount_value: 500,
    min_order_amount: 4000,
    max_discount_amount: null,
    usage_limit: 100,
    used_count: 5,
    per_customer_limit: 1,
    is_active: true,
    starts_at: "2026-01-01T00:00:00Z",
    expires_at: "2026-12-31T23:59:59Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cpn-expired",
    code: "EXPIRED50",
    description: "Expired promotional coupon",
    discount_type: "percentage",
    discount_value: 50,
    min_order_amount: 500,
    max_discount_amount: 500,
    usage_limit: 10,
    used_count: 0,
    per_customer_limit: 1,
    is_active: true,
    starts_at: "2025-01-01T00:00:00Z",
    expires_at: "2025-06-01T00:00:00Z", // Past date
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

const fallbackRedemptions: CouponRedemption[] = [];

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  couponId?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount: number;
  message?: string;
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  customerEmail?: string,
  userId?: string
): Promise<CouponValidationResult> {
  const normalizedCode = (code || "").trim().toUpperCase();
  if (!normalizedCode) {
    return { valid: false, discountAmount: 0, message: "Please enter a coupon code" };
  }

  let coupon: Coupon | undefined;

  // Try DB first if configured
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", normalizedCode)
        .single();

      if (!error && data) {
        coupon = data as Coupon;
      }
    } catch {
      // Fallback
    }
  }

  if (!coupon && process.env.NODE_ENV !== "production") {
    coupon = INITIAL_COUPONS.find((c) => c.code === normalizedCode);
  }

  if (!coupon) {
    return { valid: false, discountAmount: 0, message: "Invalid coupon code" };
  }

  if (!coupon.is_active) {
    return { valid: false, discountAmount: 0, message: "This coupon is no longer active" };
  }

  const now = new Date();

  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, discountAmount: 0, message: "This coupon is not active yet" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, discountAmount: 0, message: "This coupon has expired" };
  }

  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, discountAmount: 0, message: "This coupon usage limit has been reached" };
  }

  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order amount for this coupon is ৳${coupon.min_order_amount.toLocaleString()}`,
    };
  }

  // Check customer redemption limit
  if (customerEmail || userId) {
    let customerRedemptionsCount = 0;
    if (isServiceRoleConfigured()) {
      try {
        let query = supabaseAdmin
          .from("coupon_redemptions")
          .select("id", { count: "exact" })
          .eq("coupon_id", coupon.id);

        if (userId) {
          query = query.eq("user_id", userId);
        } else if (customerEmail) {
          query = query.eq("customer_email", customerEmail.toLowerCase());
        }

        const { count } = await query;
        customerRedemptionsCount = count || 0;
      } catch {
        // Fallback
      }
    } else {
      customerRedemptionsCount = fallbackRedemptions.filter(
        (r) =>
          r.coupon_id === coupon!.id &&
          ((userId && r.user_id === userId) ||
            (customerEmail && r.customer_email?.toLowerCase() === customerEmail.toLowerCase()))
      ).length;
    }

    if (customerRedemptionsCount >= coupon.per_customer_limit) {
      return {
        valid: false,
        discountAmount: 0,
        message: `You have already used this coupon the maximum allowed times (${coupon.per_customer_limit})`,
      };
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    const rawDiscount = (subtotal * coupon.discount_value) / 100;
    if (coupon.max_discount_amount !== null && coupon.max_discount_amount > 0) {
      discountAmount = Math.min(rawDiscount, coupon.max_discount_amount);
    } else {
      discountAmount = rawDiscount;
    }
  } else {
    // Fixed discount
    discountAmount = Math.min(coupon.discount_value, subtotal);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    code: coupon.code,
    couponId: coupon.id,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    discountAmount,
    message: `${coupon.code} applied successfully!`,
  };
}

export async function recordCouponRedemption(
  couponId: string,
  orderId: string,
  discountAmount: number,
  customerEmail?: string,
  userId?: string
) {
  if (isServiceRoleConfigured()) {
    try {
      // 1. Try atomic database transaction RPC with row lock
      const { data: rpcSuccess, error: rpcError } = await supabaseAdmin.rpc("redeem_coupon_atomic", {
        p_coupon_id: couponId,
        p_order_id: orderId,
        p_discount_amount: discountAmount,
        p_customer_email: customerEmail?.toLowerCase() || null,
        p_user_id: userId || null,
      });

      if (!rpcError && rpcSuccess) {
        return;
      }

      // Fallback direct update & insert if RPC is not yet applied
      const { data: cpn } = await supabaseAdmin
        .from("coupons")
        .select("used_count")
        .eq("id", couponId)
        .single();

      if (cpn) {
        await supabaseAdmin
          .from("coupons")
          .update({ used_count: (cpn.used_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq("id", couponId);
      }

      await supabaseAdmin.from("coupon_redemptions").insert({
        coupon_id: couponId,
        order_id: orderId,
        customer_email: customerEmail?.toLowerCase() || null,
        user_id: userId || null,
        discount_amount: discountAmount,
      });
      return;
    } catch (err) {
      console.error("Error recording coupon redemption in DB:", err);
    }
  }

  // Reject silent in-memory fallback in production
  if (process.env.NODE_ENV === "production") {
    console.error("Production database not configured for coupon redemption.");
    return;
  }

  // In-memory update
  const cpn = INITIAL_COUPONS.find((c) => c.id === couponId);
  if (cpn) {
    cpn.used_count += 1;
  }
  fallbackRedemptions.push({
    id: `red-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    coupon_id: couponId,
    order_id: orderId,
    customer_email: customerEmail?.toLowerCase() || null,
    user_id: userId || null,
    discount_amount: discountAmount,
    created_at: new Date().toISOString(),
  });
}

export async function getAllCoupons(): Promise<Coupon[]> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as Coupon[];
      }
    } catch {
      // Fallback
    }
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  return [...INITIAL_COUPONS];
}

export async function createCoupon(input: Omit<Coupon, "id" | "used_count" | "created_at" | "updated_at">): Promise<Coupon> {
  const newCoupon: Coupon = {
    ...input,
    id: `cpn-${Date.now()}`,
    code: input.code.trim().toUpperCase(),
    used_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("coupons")
        .insert({
          code: newCoupon.code,
          description: newCoupon.description,
          discount_type: newCoupon.discount_type,
          discount_value: newCoupon.discount_value,
          min_order_amount: newCoupon.min_order_amount,
          max_discount_amount: newCoupon.max_discount_amount,
          usage_limit: newCoupon.usage_limit,
          per_customer_limit: newCoupon.per_customer_limit,
          is_active: newCoupon.is_active,
          starts_at: newCoupon.starts_at,
          expires_at: newCoupon.expires_at,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Coupon;
      }
    } catch (err) {
      console.error("DB create coupon error:", err);
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Production database is not configured. Coupon creation rejected.");
  }

  INITIAL_COUPONS.unshift(newCoupon);
  return newCoupon;
}

export async function toggleCouponActive(couponId: string, isActive: boolean): Promise<boolean> {
  if (isServiceRoleConfigured()) {
    try {
      const { error } = await supabaseAdmin
        .from("coupons")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", couponId);
      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const cpn = INITIAL_COUPONS.find((c) => c.id === couponId);
  if (cpn) {
    cpn.is_active = isActive;
    return true;
  }
  return false;
}
