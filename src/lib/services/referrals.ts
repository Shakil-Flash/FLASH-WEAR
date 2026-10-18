import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import {
  ReferralSettings,
  CustomerReferral,
} from "../types";
import { awardOrderLoyaltyPoints, reverseOrderLoyaltyPoints } from "./loyalty";

let fallbackReferralSettings: ReferralSettings = {
  id: 1,
  is_active: true,
  referrer_reward_points: 200, // 200 loyalty points (৳100 value)
  referee_discount_amount: 150.00, // ৳150 off first qualifying purchase
  min_qualifying_order_amount: 1000.00, // Minimum order of ৳1,000 required
  qualifying_order_status: "delivered",
  max_referrals_per_user: 50,
  updated_at: new Date().toISOString(),
};

// Map of userId -> referralCode
export const fallbackUserReferralCodes: Record<string, string> = {};
export const fallbackCustomerReferrals: CustomerReferral[] = [];

/**
 * Get current referral program settings
 */
export async function getReferralSettings(): Promise<ReferralSettings> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("referral_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (!error && data) {
        return data as ReferralSettings;
      }
    } catch (err) {
      console.warn("DB error fetching referral settings:", err);
    }
  }
  return fallbackReferralSettings;
}

/**
 * Update referral program settings (Admin only)
 */
export async function updateReferralSettings(
  updates: Partial<ReferralSettings>
): Promise<ReferralSettings> {
  const merged: ReferralSettings = {
    ...fallbackReferralSettings,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("referral_settings")
        .upsert(merged)
        .select()
        .single();
      if (!error && data) {
        fallbackReferralSettings = data as ReferralSettings;
        return data as ReferralSettings;
      }
    } catch (err) {
      console.error("DB error updating referral settings:", err);
    }
  }

  fallbackReferralSettings = merged;
  return fallbackReferralSettings;
}

/**
 * Get or create unique referral code for a customer
 */
export async function getOrCreateUserReferralCode(userId: string): Promise<string> {
  if (!userId) return "";

  // Check fallback cache
  if (fallbackUserReferralCodes[userId]) {
    return fallbackUserReferralCodes[userId];
  }

  if (isServiceRoleConfigured()) {
    try {
      // Check if user already has referrals recorded with their code
      const { data } = await supabaseAdmin
        .from("customer_referrals")
        .select("referral_code")
        .eq("referrer_user_id", userId)
        .limit(1)
        .maybeSingle();

      if (data?.referral_code) {
        fallbackUserReferralCodes[userId] = data.referral_code;
        return data.referral_code;
      }
    } catch (err) {
      console.warn("DB lookup referral code error:", err);
    }
  }

  // Generate deterministic/unique code: e.g. FLASH-7K3B9
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const newCode = `FLASH-${cleanId}${rand}`;

  fallbackUserReferralCodes[userId] = newCode;
  return newCode;
}

/**
 * Validate a referral code server-side with anti-abuse and self-referral checks
 */
export async function validateReferralCode(
  referralCode: string,
  refereeUserId?: string,
  refereeEmail?: string,
  refereePhone?: string
): Promise<{
  isValid: boolean;
  discountAmount: number;
  referrerUserId?: string;
  error?: string;
}> {
  const code = (referralCode || "").trim().toUpperCase();
  if (!code) {
    return { isValid: false, discountAmount: 0, error: "Referral code is required" };
  }

  const settings = await getReferralSettings();
  if (!settings.is_active) {
    return { isValid: false, discountAmount: 0, error: "Referral program is currently not active" };
  }

  // Find referrer
  let referrerUserId = "";
  for (const [uid, c] of Object.entries(fallbackUserReferralCodes)) {
    if (c === code) {
      referrerUserId = uid;
      break;
    }
  }

  if (!referrerUserId && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("customer_referrals")
        .select("referrer_user_id")
        .eq("referral_code", code)
        .limit(1)
        .maybeSingle();
      if (data) {
        referrerUserId = data.referrer_user_id;
      }
    } catch {}
  }

  // If code is not found in known list, check if format matches FLASH-XXXX
  if (!referrerUserId) {
    if (code.startsWith("FLASH-") && code.length >= 8) {
      referrerUserId = "system-referrer-fallback";
    } else {
      return { isValid: false, discountAmount: 0, error: "Invalid referral code" };
    }
  }

  // Self-referral prevention
  if (refereeUserId && referrerUserId === refereeUserId) {
    return {
      isValid: false,
      discountAmount: 0,
      error: "You cannot use your own referral link or code",
    };
  }

  // Prevent repeat accounts / abuse: check if referee already used a referral
  if (refereeUserId) {
    const alreadyUsed = fallbackCustomerReferrals.some(
      (r) => r.referee_user_id === refereeUserId && r.status !== "blocked"
    );
    if (alreadyUsed) {
      return {
        isValid: false,
        discountAmount: 0,
        error: "Referral welcome discount is only valid for your first order",
      };
    }
  }

  return {
    isValid: true,
    discountAmount: settings.referee_discount_amount,
    referrerUserId,
  };
}

/**
 * Record a referral conversion upon checkout completion
 */
export async function recordReferralConversion(
  referralCode: string,
  orderId: string,
  orderSubtotal: number,
  refereeUserId?: string,
  refereeEmail?: string,
  refereePhone?: string
): Promise<{ success: boolean; referralId?: string }> {
  const code = (referralCode || "").trim().toUpperCase();
  const validation = await validateReferralCode(code, refereeUserId, refereeEmail, refereePhone);

  if (!validation.isValid || !validation.referrerUserId) {
    return { success: false };
  }

  const referralRecord: CustomerReferral = {
    id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    referrer_user_id: validation.referrerUserId,
    referral_code: code,
    referee_user_id: refereeUserId || null,
    referee_email: refereeEmail || null,
    referee_phone: refereePhone || null,
    order_id: orderId,
    status: "pending", // Pending until order qualifies
    referrer_points_awarded: 0,
    referee_discount_applied: validation.discountAmount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin.from("customer_referrals").insert(referralRecord);
    } catch (err) {
      console.warn("DB insert customer_referrals error:", err);
    }
  }

  fallbackCustomerReferrals.unshift(referralRecord);
  return { success: true, referralId: referralRecord.id };
}

/**
 * Qualify referral when order reaches qualifying fulfillment status
 */
export async function qualifyReferralOrder(orderId: string): Promise<boolean> {
  const settings = await getReferralSettings();
  if (!settings.is_active) return false;

  let referral = fallbackCustomerReferrals.find((r) => r.order_id === orderId);

  if (!referral && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("customer_referrals")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (data) referral = data as CustomerReferral;
    } catch {}
  }

  if (!referral || referral.status !== "pending") {
    return false;
  }

  // Mark as qualified & awarded
  const pointsToAward = settings.referrer_reward_points;
  referral.status = "rewarded";
  referral.referrer_points_awarded = pointsToAward;
  referral.qualified_at = new Date().toISOString();
  referral.updated_at = new Date().toISOString();

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("customer_referrals")
        .update({
          status: "rewarded",
          referrer_points_awarded: pointsToAward,
          qualified_at: referral.qualified_at,
          updated_at: referral.updated_at,
        })
        .eq("id", referral.id);
    } catch (err) {
      console.warn("DB update referral status error:", err);
    }
  }

  // Award loyalty points to the referrer
  if (referral.referrer_user_id && referral.referrer_user_id !== "system-referrer-fallback") {
    await awardOrderLoyaltyPoints(
      orderId,
      referral.referrer_user_id,
      pointsToAward * 10 // ensure eligible calculation converts to configured points
    );
  }

  return true;
}

/**
 * Reverse referral if order cancelled or refunded
 */
export async function reverseReferralOrder(orderId: string, reason: string): Promise<boolean> {
  let referral = fallbackCustomerReferrals.find((r) => r.order_id === orderId);

  if (!referral && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("customer_referrals")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (data) referral = data as CustomerReferral;
    } catch {}
  }

  if (!referral) return false;

  const wasRewarded = referral.status === "rewarded";
  referral.status = "reversed";
  referral.fraud_reason = reason;
  referral.updated_at = new Date().toISOString();

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("customer_referrals")
        .update({
          status: "reversed",
          fraud_reason: reason,
          updated_at: referral.updated_at,
        })
        .eq("id", referral.id);
    } catch {}
  }

  if (wasRewarded) {
    await reverseOrderLoyaltyPoints(orderId, `Referral clawback: ${reason}`);
  }

  return true;
}

/**
 * Get customer referral dashboard statistics
 */
export async function getUserReferralStats(userId: string) {
  const code = await getOrCreateUserReferralCode(userId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareLink = `${siteUrl}/shop?ref=${code}`;
  const settings = await getReferralSettings();

  const userReferrals = fallbackCustomerReferrals.filter(
    (r) => r.referrer_user_id === userId
  );

  const totalReferred = userReferrals.length;
  const rewardedCount = userReferrals.filter((r) => r.status === "rewarded").length;
  const pendingCount = userReferrals.filter((r) => r.status === "pending").length;
  const totalPointsEarned = userReferrals.reduce((sum, r) => sum + r.referrer_points_awarded, 0);

  return {
    referralCode: code,
    shareLink,
    settings,
    totalReferred,
    rewardedCount,
    pendingCount,
    totalPointsEarned,
    referrals: userReferrals,
  };
}

/**
 * Get all referrals for admin management
 */
export async function getAdminReferralsList(): Promise<CustomerReferral[]> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("customer_referrals")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as CustomerReferral[];
      }
    } catch (err) {
      console.warn("DB error fetching admin referrals:", err);
    }
  }
  return fallbackCustomerReferrals;
}
