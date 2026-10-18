import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import {
  LoyaltySettings,
  LoyaltyPointsLedgerEntry,
  LoyaltyEventType,
} from "../types";

// Default in-memory settings for development or when DB table not yet seeded
let fallbackLoyaltySettings: LoyaltySettings = {
  id: 1,
  is_active: true,
  points_per_100_bdt: 10, // 10 points for every ৳100 spent (10% back in points)
  point_value_bdt: 0.50, // 1 point = ৳0.50 (e.g. 100 points = ৳50 discount)
  min_redemption_points: 100, // Minimum 100 points needed to redeem
  max_redemption_points: 1000, // Max 1,000 points (৳500) per order
  can_combine_with_coupon: false, // Cannot stack loyalty points with discount coupon by default
  points_expiry_days: 365,
  qualifying_order_status: "delivered", // Points awarded once goods delivered
  updated_at: new Date().toISOString(),
};

// In-memory fallback ledger for test environments
export const fallbackLoyaltyLedger: LoyaltyPointsLedgerEntry[] = [];

/**
 * Get current loyalty program settings
 */
export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("loyalty_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (!error && data) {
        return data as LoyaltySettings;
      }
    } catch (err) {
      console.warn("Failed to fetch loyalty settings from DB:", err);
    }
  }
  return fallbackLoyaltySettings;
}

/**
 * Update loyalty program settings (Admin only)
 */
export async function updateLoyaltySettings(
  updates: Partial<LoyaltySettings>
): Promise<LoyaltySettings> {
  const merged: LoyaltySettings = {
    ...fallbackLoyaltySettings,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("loyalty_settings")
        .upsert(merged)
        .select()
        .single();
      if (!error && data) {
        fallbackLoyaltySettings = data as LoyaltySettings;
        return data as LoyaltySettings;
      }
    } catch (err) {
      console.error("DB error updating loyalty settings:", err);
    }
  }

  fallbackLoyaltySettings = merged;
  return fallbackLoyaltySettings;
}

/**
 * Get customer's current available loyalty points balance
 */
export async function getUserLoyaltyBalance(userId: string): Promise<number> {
  if (!userId) return 0;

  if (isServiceRoleConfigured()) {
    try {
      // Find latest balance_after from the ledger
      const { data, error } = await supabaseAdmin
        .from("loyalty_points_ledger")
        .select("balance_after")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data.balance_after ?? 0;
      }
    } catch (err) {
      console.warn("Error reading loyalty balance from DB:", err);
    }
  }

  // Fallback memory calculation
  const userEntries = fallbackLoyaltyLedger
    .filter((entry) => entry.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return userEntries.length > 0 ? userEntries[0].balance_after : 0;
}

/**
 * Get customer's loyalty ledger history
 */
export async function getUserLoyaltyLedger(
  userId: string
): Promise<LoyaltyPointsLedgerEntry[]> {
  if (!userId) return [];

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("loyalty_points_ledger")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as LoyaltyPointsLedgerEntry[];
      }
    } catch (err) {
      console.warn("Error reading loyalty ledger from DB:", err);
    }
  }

  return fallbackLoyaltyLedger
    .filter((entry) => entry.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Atomically redeem loyalty points for an order
 */
export async function redeemLoyaltyPoints(
  userId: string,
  pointsToRedeem: number,
  orderId?: string
): Promise<{ success: boolean; redeemedPoints: number; discountAmount: number; error?: string }> {
  if (pointsToRedeem <= 0) {
    return { success: false, redeemedPoints: 0, discountAmount: 0, error: "Points must be greater than 0" };
  }

  const settings = await getLoyaltySettings();
  if (!settings.is_active) {
    return { success: false, redeemedPoints: 0, discountAmount: 0, error: "Loyalty program is currently inactive" };
  }

  if (pointsToRedeem < settings.min_redemption_points) {
    return {
      success: false,
      redeemedPoints: 0,
      discountAmount: 0,
      error: `Minimum ${settings.min_redemption_points} points required for redemption`,
    };
  }

  if (pointsToRedeem > settings.max_redemption_points) {
    return {
      success: false,
      redeemedPoints: 0,
      discountAmount: 0,
      error: `Maximum ${settings.max_redemption_points} points allowed per order`,
    };
  }

  const discountAmount = Number((pointsToRedeem * settings.point_value_bdt).toFixed(2));

  // Try DB atomic RPC
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin.rpc("redeem_loyalty_points_atomic", {
        p_user_id: userId,
        p_points_to_redeem: pointsToRedeem,
        p_order_id: orderId || null,
      });

      if (!error && data && data.success) {
        return {
          success: true,
          redeemedPoints: pointsToRedeem,
          discountAmount,
        };
      } else if (data?.error) {
        return {
          success: false,
          redeemedPoints: 0,
          discountAmount: 0,
          error: data.error,
        };
      }
    } catch (err) {
      console.warn("DB RPC redeem_loyalty_points_atomic error:", err);
    }
  }

  // Fallback in-memory ledger debit with balance check
  const currentBalance = await getUserLoyaltyBalance(userId);
  if (currentBalance < pointsToRedeem) {
    return {
      success: false,
      redeemedPoints: 0,
      discountAmount: 0,
      error: `Insufficient points balance: you have ${currentBalance} points`,
    };
  }

  const newBalance = currentBalance - pointsToRedeem;
  const entry: LoyaltyPointsLedgerEntry = {
    id: `loyalty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    points: -pointsToRedeem,
    balance_after: newBalance,
    event_type: "order_redeemed",
    order_id: orderId || null,
    notes: `Redeemed ${pointsToRedeem} points (৳${discountAmount} off)`,
    created_at: new Date().toISOString(),
  };

  fallbackLoyaltyLedger.unshift(entry);

  return {
    success: true,
    redeemedPoints: pointsToRedeem,
    discountAmount,
  };
}

/**
 * Award points for an order that reached the qualifying status
 */
export async function awardOrderLoyaltyPoints(
  orderId: string,
  userId: string,
  eligibleAmount: number
): Promise<{ success: boolean; pointsAwarded: number }> {
  if (!userId || eligibleAmount <= 0) {
    return { success: false, pointsAwarded: 0 };
  }

  const settings = await getLoyaltySettings();
  if (!settings.is_active) {
    return { success: false, pointsAwarded: 0 };
  }

  // Calculate points: e.g. 10 points per ৳100 spent
  const pointsAwarded = Math.floor((eligibleAmount / 100) * settings.points_per_100_bdt);
  if (pointsAwarded <= 0) {
    return { success: false, pointsAwarded: 0 };
  }

  // Try DB atomic RPC
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin.rpc("award_loyalty_points_atomic", {
        p_user_id: userId,
        p_points_to_award: pointsAwarded,
        p_order_id: orderId,
        p_event_type: "order_earned",
        p_notes: `Earned ${pointsAwarded} points for qualifying order completion`,
      });

      if (!error && data?.success) {
        return { success: true, pointsAwarded };
      }
    } catch (err) {
      console.warn("DB RPC award_loyalty_points_atomic error:", err);
    }
  }

  // Fallback in-memory award with idempotency check
  const alreadyAwarded = fallbackLoyaltyLedger.some(
    (e) => e.order_id === orderId && e.event_type === "order_earned"
  );
  if (alreadyAwarded) {
    return { success: true, pointsAwarded: 0 };
  }

  const currentBalance = await getUserLoyaltyBalance(userId);
  const newBalance = currentBalance + pointsAwarded;

  const entry: LoyaltyPointsLedgerEntry = {
    id: `loyalty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    points: pointsAwarded,
    balance_after: newBalance,
    event_type: "order_earned",
    order_id: orderId,
    notes: `Earned ${pointsAwarded} points for order completion`,
    created_at: new Date().toISOString(),
  };

  fallbackLoyaltyLedger.unshift(entry);
  return { success: true, pointsAwarded };
}

/**
 * Reverse points on order cancellation, refund, or return
 */
export async function reverseOrderLoyaltyPoints(
  orderId: string,
  reason: string = "Order cancelled or returned"
): Promise<{ success: boolean; pointsReversed: number; pointsRefunded: number }> {
  if (!orderId) return { success: false, pointsReversed: 0, pointsRefunded: 0 };

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin.rpc("reverse_loyalty_points_atomic", {
        p_order_id: orderId,
        p_reason: reason,
      });

      if (!error && data?.success) {
        return {
          success: true,
          pointsReversed: data.points_clawed_back ?? 0,
          pointsRefunded: data.points_refunded ?? 0,
        };
      }
    } catch (err) {
      console.warn("DB RPC reverse_loyalty_points_atomic error:", err);
    }
  }

  // Fallback in-memory reversal
  let pointsReversed = 0;
  let pointsRefunded = 0;

  // 1. Check if points were earned on this order
  const earnedEntry = fallbackLoyaltyLedger.find(
    (e) => e.order_id === orderId && e.event_type === "order_earned"
  );
  if (earnedEntry) {
    const alreadyClawed = fallbackLoyaltyLedger.some(
      (e) => e.order_id === orderId && e.event_type === "order_cancelled_reversal"
    );
    if (!alreadyClawed) {
      pointsReversed = earnedEntry.points;
      const curBal = await getUserLoyaltyBalance(earnedEntry.user_id);
      const newBal = Math.max(0, curBal - pointsReversed);
      fallbackLoyaltyLedger.unshift({
        id: `loyalty-rev-${Date.now()}`,
        user_id: earnedEntry.user_id,
        points: -pointsReversed,
        balance_after: newBal,
        event_type: "order_cancelled_reversal",
        order_id: orderId,
        notes: reason,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 2. Check if points were redeemed on this order; if so, restore them to customer
  const redeemedEntry = fallbackLoyaltyLedger.find(
    (e) => e.order_id === orderId && e.event_type === "order_redeemed"
  );
  if (redeemedEntry) {
    const alreadyRestored = fallbackLoyaltyLedger.some(
      (e) => e.order_id === orderId && e.event_type === "admin_adjustment" && e.notes?.includes("Refunded")
    );
    if (!alreadyRestored) {
      pointsRefunded = Math.abs(redeemedEntry.points);
      const curBal = await getUserLoyaltyBalance(redeemedEntry.user_id);
      const newBal = curBal + pointsRefunded;
      fallbackLoyaltyLedger.unshift({
        id: `loyalty-res-${Date.now()}`,
        user_id: redeemedEntry.user_id,
        points: pointsRefunded,
        balance_after: newBal,
        event_type: "admin_adjustment",
        order_id: orderId,
        notes: `Refunded ${pointsRefunded} redeemed points due to order cancellation`,
        created_at: new Date().toISOString(),
      });
    }
  }

  return { success: true, pointsReversed, pointsRefunded };
}

/**
 * Admin manual adjustment with audit trail
 */
export async function adjustLoyaltyPointsAdmin(
  adminActor: string,
  targetUserId: string,
  points: number,
  reason: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  if (points === 0) {
    return { success: false, newBalance: 0, error: "Points cannot be 0" };
  }

  const curBalance = await getUserLoyaltyBalance(targetUserId);
  const newBalance = curBalance + points;

  if (newBalance < 0) {
    return {
      success: false,
      newBalance: curBalance,
      error: `Cannot reduce points below zero (current: ${curBalance}, change: ${points})`,
    };
  }

  const entry: LoyaltyPointsLedgerEntry = {
    id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: targetUserId,
    points,
    balance_after: newBalance,
    event_type: "admin_adjustment",
    reference_id: adminActor,
    notes: `Admin adjustment by ${adminActor}: ${reason}`,
    created_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      const { error } = await supabaseAdmin.from("loyalty_points_ledger").insert(entry);
      if (!error) {
        return { success: true, newBalance };
      }
    } catch (err) {
      console.warn("DB error inserting admin adjustment:", err);
    }
  }

  fallbackLoyaltyLedger.unshift(entry);
  return { success: true, newBalance };
}
