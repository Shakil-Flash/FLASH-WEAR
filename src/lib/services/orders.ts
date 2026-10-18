import { z } from "zod";
import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from "../data/mock-catalog";
import { CheckoutInput, Order, OrderStatus, PaymentStatus, ShipmentStatus } from "../types";
import { calculateDeliveryFee } from "../utils/format-currency";
import { generateOrderNumber, generateReceiptToken } from "../utils/order-number";
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail, sendPaymentSuccessEmail, sendShipmentDispatchedEmail } from "../email/resend";
import { validateCoupon, recordCouponRedemption } from "./coupons";
import {
  getLoyaltySettings,
  getUserLoyaltyBalance,
  redeemLoyaltyPoints,
  awardOrderLoyaltyPoints,
  reverseOrderLoyaltyPoints,
} from "./loyalty";
import {
  validateReferralCode,
  recordReferralConversion,
  qualifyReferralOrder,
  reverseReferralOrder,
} from "./referrals";

export const checkoutSchema = z.object({
  userId: z.string().optional(),
  customerName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  customerPhone: z
    .string()
    .regex(/^(?:\+?8801|01)[3-9]\d{8}$/, "Please enter a valid Bangladesh phone number (e.g., 01712345678)"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  division: z.string().min(2, "Please select your division"),
  district: z.string().min(2, "Please enter your district"),
  deliveryAddress: z.string().min(10, "Please provide your detailed delivery address with house/road details"),
  orderNotes: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash_on_delivery", "sslcommerz"]).default("cash_on_delivery"),
  couponCode: z.string().optional(),
  loyaltyPointsToRedeem: z.number().int().min(0).optional(),
  referralCode: z.string().optional(),
  idempotencyKey: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, "Variant ID is required"),
        quantity: z.number().int().positive("Quantity must be at least 1").max(10, "Maximum 10 units per item"),
      })
    )
    .min(1, "Your cart is empty"),
});

// In-memory persistent order store for testing and fallback mode
export const fallbackOrders: Order[] = [];

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  receiptToken?: string;
  orderId?: string;
  paymentMethod?: "cash_on_delivery" | "sslcommerz";
  totalAmount?: number;
  isDuplicate?: boolean;
  error?: string;
}

export async function createGuestOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  // 1. Server-side validation with Zod
  const validated = checkoutSchema.safeParse(input);
  if (!validated.success) {
    const errorMsg = validated.error.errors.map((e) => e.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const {
    userId,
    customerName,
    customerPhone,
    customerEmail,
    division,
    district,
    deliveryAddress,
    orderNotes,
    paymentMethod,
    couponCode,
    loyaltyPointsToRedeem,
    referralCode,
    idempotencyKey,
    items,
  } = validated.data;

  // 2. Fetch official product & variant data to calculate true prices and verify inventory
  if (isServiceRoleConfigured()) {
    try {
      const variantIds = items.map((i) => i.variantId);
      const { data: variants, error: varError } = await supabaseAdmin
        .from("product_variants")
        .select(`
          id,
          sku,
          size,
          color,
          inventory_quantity,
          product:products (
            id,
            name,
            price,
            images:product_images (url)
          )
        `)
        .in("id", variantIds);

      if (!varError && variants && variants.length === items.length) {
        let subtotal = 0;
        const snapshotItems: any[] = [];

        for (const item of items) {
          const v = variants.find((x: any) => x.id === item.variantId);
          if (!v) {
            return { success: false, error: `Variant not found: ${item.variantId}` };
          }
          if (v.inventory_quantity < item.quantity) {
            return {
              success: false,
              error: `Insufficient stock for ${v.sku} (${v.size}, ${v.color}). Only ${v.inventory_quantity} available.`,
            };
          }
          const p = v.product as any;
          const unitPrice = Number(p.price);
          const lineTotal = unitPrice * item.quantity;
          subtotal += lineTotal;

          snapshotItems.push({
            variant_id: v.id,
            product_id: p.id,
            product_name: p.name,
            sku: v.sku,
            size: v.size,
            color: v.color,
            unit_price: unitPrice,
            quantity: item.quantity,
            line_total: lineTotal,
            product_image_url: p.images?.[0]?.url || null,
          });
        }

        // Validate coupon if applied
        let discountAmount = 0;
        let appliedCouponId: string | null = null;
        let appliedCouponCode: string | null = null;

        if (couponCode) {
          const couponRes = await validateCoupon(couponCode, subtotal, customerEmail || undefined, userId);
          if (couponRes.valid) {
            discountAmount = couponRes.discountAmount;
            appliedCouponId = couponRes.couponId || null;
            appliedCouponCode = couponRes.code || null;
          }
        }

        // Validate loyalty points if requested
        let loyaltyDiscountAmount = 0;
        let pointsToRedeem = 0;
        if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
          if (!userId) {
            return { success: false, error: "Please log in to redeem loyalty points." };
          }
          const loyaltySettings = await getLoyaltySettings();
          if (!loyaltySettings.is_active) {
            return { success: false, error: "Loyalty program is currently inactive." };
          }
          if (appliedCouponCode && !loyaltySettings.can_combine_with_coupon) {
            return { success: false, error: "Loyalty points cannot be combined with a coupon code on the same order." };
          }
          const userBalance = await getUserLoyaltyBalance(userId);
          if (userBalance < loyaltyPointsToRedeem) {
            return { success: false, error: `Insufficient loyalty points balance (available: ${userBalance}).` };
          }
          if (loyaltyPointsToRedeem < loyaltySettings.min_redemption_points) {
            return { success: false, error: `Minimum ${loyaltySettings.min_redemption_points} points required to redeem.` };
          }
          if (loyaltyPointsToRedeem > loyaltySettings.max_redemption_points) {
            return { success: false, error: `Maximum ${loyaltySettings.max_redemption_points} points can be redeemed per order.` };
          }
          pointsToRedeem = loyaltyPointsToRedeem;
          loyaltyDiscountAmount = Number((pointsToRedeem * loyaltySettings.point_value_bdt).toFixed(2));
        }

        // Validate referral code if provided
        let referralDiscountAmount = 0;
        let appliedReferralCode: string | null = null;
        if (referralCode) {
          const refRes = await validateReferralCode(
            referralCode,
            userId,
            customerEmail || undefined,
            customerPhone
          );
          if (refRes.isValid) {
            referralDiscountAmount = refRes.discountAmount;
            appliedReferralCode = referralCode.trim().toUpperCase();
          }
        }

        const totalDiscounts = Math.min(subtotal, discountAmount + loyaltyDiscountAmount + referralDiscountAmount);
        const deliveryFee = calculateDeliveryFee(division);
        const totalAmount = Math.max(0, subtotal - totalDiscounts + deliveryFee);
        const orderNumber = generateOrderNumber();
        const receiptToken = generateReceiptToken();

        // Call atomic postgres procedure
        const { data: rpcRes, error: rpcError } = await supabaseAdmin.rpc("create_guest_order_atomic", {
          p_order_number: orderNumber,
          p_customer_name: customerName,
          p_customer_phone: customerPhone,
          p_customer_email: customerEmail || null,
          p_division: division,
          p_district: district,
          p_delivery_address: deliveryAddress,
          p_order_notes: orderNotes || null,
          p_subtotal: subtotal,
          p_delivery_fee: deliveryFee,
          p_total_amount: totalAmount,
          p_receipt_token: receiptToken,
          p_idempotency_key: idempotencyKey || null,
          p_items: snapshotItems,
        });

        if (rpcError) {
          return { success: false, error: rpcError.message };
        }

        const res = rpcRes as any;

        // Add Phase 2 and Phase 3 fields if newly created
        if (!res.is_duplicate) {
          await supabaseAdmin
            .from("orders")
            .update({
              user_id: userId || null,
              payment_method: paymentMethod,
              payment_status: paymentMethod === "sslcommerz" ? "pending" : "unpaid",
              coupon_id: appliedCouponId,
              coupon_code: appliedCouponCode,
              discount_amount: totalDiscounts,
              loyalty_points_redeemed: pointsToRedeem,
              loyalty_discount_amount: loyaltyDiscountAmount,
              referral_code_used: appliedReferralCode,
            })
            .eq("id", res.order_id);

          if (appliedCouponId) {
            await recordCouponRedemption(
              appliedCouponId,
              res.order_id,
              discountAmount,
              customerEmail || undefined,
              userId
            );
          }

          if (pointsToRedeem > 0 && userId) {
            await redeemLoyaltyPoints(userId, pointsToRedeem, res.order_id);
          }

          if (appliedReferralCode) {
            await recordReferralConversion(
              appliedReferralCode,
              res.order_id,
              subtotal,
              userId,
              customerEmail || undefined,
              customerPhone
            );
          }
        }

        const orderSummary = {
          orderNumber: res.order_number,
          customerName,
          customerEmail,
          customerPhone,
          division,
          district,
          deliveryAddress,
          subtotal,
          deliveryFee,
          totalAmount,
          items: snapshotItems.map((s) => ({
            productName: s.product_name,
            size: s.size,
            color: s.color,
            quantity: s.quantity,
            unitPrice: s.unit_price,
            lineTotal: s.line_total,
          })),
        };

        if (customerEmail) {
          sendOrderConfirmationEmail(orderSummary).catch((e) => console.error("Email error:", e));
        }
        sendAdminNewOrderEmail(orderSummary).catch((e) => console.error("Admin email error:", e));

        return {
          success: true,
          orderNumber: res.order_number,
          receiptToken: res.receipt_token,
          orderId: res.order_id,
          paymentMethod,
          totalAmount,
          isDuplicate: res.is_duplicate || false,
        };
      }
    } catch (err: any) {
      console.warn("Supabase order error, using fallback pipeline:", err.message);
    }
  }

  // 3. Fallback Pipeline (In-memory atomic validation and stock reservation)
  if (idempotencyKey) {
    const existing = fallbackOrders.find((o) => (o as any).idempotencyKey === idempotencyKey);
    if (existing) {
      return {
        success: true,
        orderNumber: existing.order_number,
        receiptToken: existing.receipt_token,
        orderId: existing.id,
        paymentMethod: existing.payment_method,
        totalAmount: existing.total_amount,
        isDuplicate: true,
      };
    }
  }

  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    let matchedVariant: any = null;
    let matchedProduct: any = null;

    for (const p of INITIAL_PRODUCTS) {
      const v = p.variants?.find((x) => x.id === item.variantId);
      if (v) {
        matchedVariant = v;
        matchedProduct = p;
        break;
      }
    }

    if (!matchedVariant || !matchedProduct) {
      return { success: false, error: `Selected variant is no longer available.` };
    }

    if (matchedVariant.inventory_quantity < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${matchedProduct.name} (${matchedVariant.size}, ${matchedVariant.color}). Only ${matchedVariant.inventory_quantity} available.`,
      };
    }

    const unitPrice = matchedProduct.price;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      order_id: "",
      product_id: matchedProduct.id,
      variant_id: matchedVariant.id,
      product_name: matchedProduct.name,
      sku: matchedVariant.sku,
      size: matchedVariant.size,
      color: matchedVariant.color,
      unit_price: unitPrice,
      quantity: item.quantity,
      line_total: lineTotal,
      product_image_url: matchedProduct.images?.[0]?.url || null,
    });
  }

  // Server-side coupon verification
  let discountAmount = 0;
  let appliedCouponId: string | null = null;
  let appliedCouponCode: string | null = null;

  if (couponCode) {
    const couponRes = await validateCoupon(couponCode, subtotal, customerEmail || undefined, userId);
    if (couponRes.valid) {
      discountAmount = couponRes.discountAmount;
      appliedCouponId = couponRes.couponId || null;
      appliedCouponCode = couponRes.code || null;
    }
  }

  // Validate loyalty points if requested
  let loyaltyDiscountAmount = 0;
  let pointsToRedeem = 0;
  if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
    if (!userId) {
      return { success: false, error: "Please log in to redeem loyalty points." };
    }
    const loyaltySettings = await getLoyaltySettings();
    if (!loyaltySettings.is_active) {
      return { success: false, error: "Loyalty program is currently inactive." };
    }
    if (appliedCouponCode && !loyaltySettings.can_combine_with_coupon) {
      return { success: false, error: "Loyalty points cannot be combined with a coupon code on the same order." };
    }
    const userBalance = await getUserLoyaltyBalance(userId);
    if (userBalance < loyaltyPointsToRedeem) {
      return { success: false, error: `Insufficient loyalty points balance (available: ${userBalance}).` };
    }
    if (loyaltyPointsToRedeem < loyaltySettings.min_redemption_points) {
      return { success: false, error: `Minimum ${loyaltySettings.min_redemption_points} points required to redeem.` };
    }
    if (loyaltyPointsToRedeem > loyaltySettings.max_redemption_points) {
      return { success: false, error: `Maximum ${loyaltySettings.max_redemption_points} points can be redeemed per order.` };
    }
    pointsToRedeem = loyaltyPointsToRedeem;
    loyaltyDiscountAmount = Number((pointsToRedeem * loyaltySettings.point_value_bdt).toFixed(2));
  }

  // Validate referral code if provided
  let referralDiscountAmount = 0;
  let appliedReferralCode: string | null = null;
  if (referralCode) {
    const refRes = await validateReferralCode(
      referralCode,
      userId,
      customerEmail || undefined,
      customerPhone
    );
    if (refRes.isValid) {
      referralDiscountAmount = refRes.discountAmount;
      appliedReferralCode = referralCode.trim().toUpperCase();
    }
  }

  const totalDiscounts = Math.min(subtotal, discountAmount + loyaltyDiscountAmount + referralDiscountAmount);

  // Decrement inventory safely (stock reservation)
  for (const item of items) {
    for (const p of INITIAL_PRODUCTS) {
      const v = p.variants?.find((x) => x.id === item.variantId);
      if (v) {
        v.inventory_quantity -= item.quantity;
      }
    }
  }

  const deliveryFee = calculateDeliveryFee(division, INITIAL_SETTINGS.dhaka_delivery_fee, INITIAL_SETTINGS.outside_dhaka_delivery_fee);
  const totalAmount = Math.max(0, subtotal - totalDiscounts + deliveryFee);
  const orderNumber = generateOrderNumber();
  const receiptToken = generateReceiptToken();
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    user_id: userId || null,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail || null,
    division,
    district,
    delivery_address: deliveryAddress,
    order_notes: orderNotes || null,
    payment_method: paymentMethod,
    payment_status: paymentMethod === "sslcommerz" ? "pending" : "unpaid",
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: totalDiscounts,
    coupon_id: appliedCouponId,
    coupon_code: appliedCouponCode,
    loyalty_points_redeemed: pointsToRedeem,
    loyalty_discount_amount: loyaltyDiscountAmount,
    referral_code_used: appliedReferralCode,
    total_amount: totalAmount,
    status: paymentMethod === "sslcommerz" ? "pending" : "pending",
    tracking_number: null,
    courier_name: null,
    courier_consignment_id: null,
    courier_tracking_url: null,
    shipment_status: "not_shipped",
    admin_notes: null,
    receipt_token: receiptToken,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: orderItems.map((oi) => ({ ...oi, order_id: orderId })),
  };

  (newOrder as any).idempotencyKey = idempotencyKey;
  fallbackOrders.unshift(newOrder);

  if (appliedCouponId) {
    recordCouponRedemption(appliedCouponId, orderId, discountAmount, customerEmail || undefined, userId).catch(() => {});
  }

  if (pointsToRedeem > 0 && userId) {
    await redeemLoyaltyPoints(userId, pointsToRedeem, orderId);
  }

  if (appliedReferralCode) {
    await recordReferralConversion(
      appliedReferralCode,
      orderId,
      subtotal,
      userId,
      customerEmail || undefined,
      customerPhone
    );
  }

  // Send emails if configured
  if (customerEmail) {
    sendOrderConfirmationEmail({
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      division,
      district,
      deliveryAddress,
      subtotal,
      deliveryFee,
      totalAmount,
      items: orderItems.map((s) => ({
        productName: s.product_name,
        size: s.size,
        color: s.color,
        quantity: s.quantity,
        unitPrice: s.unit_price,
        lineTotal: s.line_total,
      })),
    }).catch((e) => console.error("Email dispatch skipped:", e));
  }

  return {
    success: true,
    orderNumber,
    receiptToken,
    orderId,
    paymentMethod,
    totalAmount,
    isDuplicate: false,
  };
}

// Scoped retrieval: order number AND receipt token must match, preventing unauthorized public snooping
export async function getOrderByNumberAndToken(
  orderNumber: string,
  receiptToken: string
): Promise<Order | null> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("order_number", orderNumber)
        .eq("receipt_token", receiptToken)
        .single();

      if (!error && data) {
        return data as Order;
      }
    } catch {
      // Fallback
    }
  }

  const found = fallbackOrders.find(
    (o) => o.order_number === orderNumber && o.receipt_token === receiptToken
  );
  return found || null;
}

// Order lookup by ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("id", orderId)
        .single();
      if (!error && data) {
        return data as Order;
      }
    } catch {}
  }
  return fallbackOrders.find((o) => o.id === orderId) || null;
}

// Order lookup by Order Number (Internal / Admin / Verified)
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("order_number", orderNumber)
        .single();
      if (!error && data) {
        return data as Order;
      }
    } catch {}
  }
  return fallbackOrders.find((o) => o.order_number === orderNumber) || null;
}

// Authenticated customer: fetch their orders only
export async function getCustomerOrders(userId: string): Promise<Order[]> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as Order[];
      }
    } catch {}
  }
  return fallbackOrders.filter((o) => o.user_id === userId);
}

// Authenticated customer: fetch specific order only if user owns it
export async function getCustomerOrderByNumber(orderNumber: string, userId: string): Promise<Order | null> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("order_number", orderNumber)
        .eq("user_id", userId)
        .single();
      if (!error && data) {
        return data as Order;
      }
    } catch {}
  }
  const order = fallbackOrders.find((o) => o.order_number === orderNumber && o.user_id === userId);
  return order || null;
}

// Mark order as paid upon server verification
export async function markOrderPaid(
  orderId: string,
  details: {
    tranId: string;
    valId: string;
    amount: number;
    cardType?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (isServiceRoleConfigured()) {
    try {
      // 1. Idempotency Check: Verify if order is already marked paid
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, payment_status, customer_email, customer_name, total_amount")
        .eq("id", orderId)
        .maybeSingle();

      if (existingOrder && existingOrder.payment_status === "paid") {
        // Idempotent: Order is already paid. Skip duplicate database update & duplicate email notification.
        return { success: true };
      }

      const { error } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) return { success: false, error: error.message };

      if (existingOrder?.customer_email) {
        sendPaymentSuccessEmail({
          orderNumber: existingOrder.order_number,
          customerName: existingOrder.customer_name,
          customerEmail: existingOrder.customer_email,
          amount: details.amount || existingOrder.total_amount,
          tranId: details.tranId,
          paymentChannel: details.cardType || "Online Gateway",
        }).catch((err) => console.warn("Payment confirmation email warning:", err));
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const order = fallbackOrders.find((o) => o.id === orderId);
  if (order) {
    if (order.payment_status === "paid") {
      // Idempotent guard for in-memory fallback orders
      return { success: true };
    }

    order.payment_status = "paid";
    if (order.status === "pending") order.status = "confirmed";
    order.updated_at = new Date().toISOString();

    if (order.customer_email) {
      sendPaymentSuccessEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        amount: details.amount,
        tranId: details.tranId,
        paymentChannel: details.cardType || "Online Gateway",
      }).catch(() => {});
    }
  }

  return { success: true };
}

// Mark order payment failed (allows retry without releasing or double deducting)
export async function markOrderPaymentFailed(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
          admin_notes: reason ? `Payment failed: ${reason}` : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } catch {}
  }

  const order = fallbackOrders.find((o) => o.id === orderId);
  if (order) {
    order.payment_status = "failed";
    if (reason) {
      order.admin_notes = (order.admin_notes ? order.admin_notes + "\n" : "") + `Payment failed: ${reason}`;
    }
    order.updated_at = new Date().toISOString();
  }

  return { success: true };
}

// Mark order payment cancelled: customer abandoned/cancelled checkout -> safely restore reserved stock
export async function markOrderPaymentCancelled(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const order = await getOrderById(orderId);
  if (!order) return { success: false, error: "Order not found" };

  // If already paid, do not cancel
  if (order.payment_status === "paid") {
    return { success: false, error: "Cannot cancel an order that has already been paid" };
  }

  // Restore reserved inventory if not already cancelled
  if (order.status !== "cancelled") {
    if (order.items) {
      for (const item of order.items) {
        for (const p of INITIAL_PRODUCTS) {
          const v = p.variants?.find((x) => x.id === item.variant_id);
          if (v) {
            v.inventory_quantity += item.quantity;
          }
        }
      }
    }
  }

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "cancelled",
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } catch {}
  }

  order.payment_status = "cancelled";
  order.status = "cancelled";
  order.updated_at = new Date().toISOString();

  return { success: true };
}

// Admin order listing
export async function getAdminOrders(statusFilter?: string, search?: string): Promise<Order[]> {
  if (isServiceRoleConfigured()) {
    try {
      let query = supabaseAdmin
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (search) {
        query = query.or(
          `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as Order[];
      }
    } catch {
      // Fallback
    }
  }

  let list = [...fallbackOrders];
  if (statusFilter && statusFilter !== "all") {
    list = list.filter((o) => o.status === statusFilter);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (o) =>
        o.order_number.toLowerCase().includes(s) ||
        o.customer_name.toLowerCase().includes(s) ||
        o.customer_phone.includes(s)
    );
  }
  return list;
}

export async function getAdminOrderById(orderId: string): Promise<Order | null> {
  return getOrderById(orderId);
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  if (isServiceRoleConfigured()) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (trackingNumber !== undefined) updateData.tracking_number = trackingNumber;
      if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

      const { error } = await supabaseAdmin
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (!error) {
        if (status === "delivered" || status === "confirmed") {
          const ord = await getOrderById(orderId);
          if (ord?.user_id) {
            awardOrderLoyaltyPoints(orderId, ord.user_id, ord.total_amount).catch(() => {});
          }
          qualifyReferralOrder(orderId).catch(() => {});
        } else if (status === "cancelled") {
          reverseOrderLoyaltyPoints(orderId, adminNotes || "Order cancelled").catch(() => {});
          reverseReferralOrder(orderId, adminNotes || "Order cancelled").catch(() => {});
        }
        return { success: true };
      }
      return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const order = fallbackOrders.find((o) => o.id === orderId);
  if (!order) return { success: false, error: "Order not found" };

  order.status = status;
  if (trackingNumber !== undefined) order.tracking_number = trackingNumber;
  if (adminNotes !== undefined) order.admin_notes = adminNotes;
  order.updated_at = new Date().toISOString();

  if (status === "delivered" || status === "confirmed") {
    if (order.user_id) {
      awardOrderLoyaltyPoints(orderId, order.user_id, order.total_amount).catch(() => {});
    }
    qualifyReferralOrder(orderId).catch(() => {});
  } else if (status === "cancelled") {
    reverseOrderLoyaltyPoints(orderId, adminNotes || "Order cancelled").catch(() => {});
    reverseReferralOrder(orderId, adminNotes || "Order cancelled").catch(() => {});
  }

  return { success: true };
}

// Update shipment details for an order
export async function updateOrderShipment(
  orderId: string,
  data: {
    courierName: string;
    consignmentId: string;
    trackingUrl?: string;
    shipmentStatus: ShipmentStatus;
  }
): Promise<{ success: boolean; error?: string }> {
  if (isServiceRoleConfigured()) {
    try {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({
          courier_name: data.courierName,
          courier_consignment_id: data.consignmentId,
          courier_tracking_url: data.trackingUrl || null,
          shipment_status: data.shipmentStatus,
          tracking_number: data.consignmentId,
          status: data.shipmentStatus === "delivered" ? "delivered" : "shipped",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (!error) {
        if (data.shipmentStatus === "delivered") {
          const ord = await getOrderById(orderId);
          if (ord?.user_id) {
            awardOrderLoyaltyPoints(orderId, ord.user_id, ord.total_amount).catch(() => {});
          }
          qualifyReferralOrder(orderId).catch(() => {});
        }
        return { success: true };
      }
      return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const order = fallbackOrders.find((o) => o.id === orderId);
  if (order) {
    order.courier_name = data.courierName;
    order.courier_consignment_id = data.consignmentId;
    order.courier_tracking_url = data.trackingUrl || null;
    order.shipment_status = data.shipmentStatus;
    order.tracking_number = data.consignmentId;
    order.status = data.shipmentStatus === "delivered" ? "delivered" : "shipped";
    order.updated_at = new Date().toISOString();

    if (data.shipmentStatus === "delivered") {
      if (order.user_id) {
        awardOrderLoyaltyPoints(orderId, order.user_id, order.total_amount).catch(() => {});
      }
      qualifyReferralOrder(orderId).catch(() => {});
    }

    if (order.customer_email && data.shipmentStatus === "in_transit") {
      sendShipmentDispatchedEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        courierName: data.courierName,
        consignmentId: data.consignmentId,
        trackingUrl: data.trackingUrl || "",
      }).catch(() => {});
    }
  }

  return { success: true };
}

export async function cancelOrderAndRestoreStock(
  orderId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  if (isServiceRoleConfigured()) {
    try {
      const { error } = await supabaseAdmin.rpc("cancel_order_and_restore_stock", {
        p_order_id: orderId,
        p_admin_notes: adminNotes || "Cancelled by store administrator",
      });
      if (!error) return { success: true };
      return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const order = fallbackOrders.find((o) => o.id === orderId);
  if (!order) return { success: false, error: "Order not found" };
  if (order.status === "cancelled") return { success: false, error: "Order is already cancelled" };

  // Restore inventory
  if (order.items) {
    for (const item of order.items) {
      for (const p of INITIAL_PRODUCTS) {
        const v = p.variants?.find((x) => x.id === item.variant_id);
        if (v) {
          v.inventory_quantity += item.quantity;
        }
      }
    }
  }

  order.status = "cancelled";
  order.admin_notes = (order.admin_notes ? order.admin_notes + "\n" : "") + (adminNotes || "Cancelled by store administrator");
  order.updated_at = new Date().toISOString();

  return { success: true };
}
