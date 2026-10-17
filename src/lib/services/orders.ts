import { z } from "zod";
import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from "../data/mock-catalog";
import { CheckoutInput, Order, OrderStatus } from "../types";
import { calculateDeliveryFee } from "../utils/format-currency";
import { generateOrderNumber, generateReceiptToken } from "../utils/order-number";
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from "../email/resend";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  customerPhone: z
    .string()
    .regex(/^(?:\+?8801|01)[3-9]\d{8}$/, "Please enter a valid Bangladesh phone number (e.g., 01712345678)"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  division: z.string().min(2, "Please select your division"),
  district: z.string().min(2, "Please enter your district"),
  deliveryAddress: z.string().min(10, "Please provide your detailed delivery address with house/road details"),
  orderNotes: z.string().max(500).optional(),
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
const fallbackOrders: Order[] = [];

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  receiptToken?: string;
  orderId?: string;
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
    customerName,
    customerPhone,
    customerEmail,
    division,
    district,
    deliveryAddress,
    orderNotes,
    idempotencyKey,
    items,
  } = validated.data;

  // 2. Fetch official product & variant data to calculate true prices and verify inventory
  // If Supabase service role is configured, try Supabase RPC first
  if (isServiceRoleConfigured()) {
    try {
      // Fetch variants to verify and calculate
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
        // Build items snapshot
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

        // Calculate delivery fee
        const deliveryFee = calculateDeliveryFee(division);
        const totalAmount = subtotal + deliveryFee;
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

        // Async transactional emails (won't block or crash if Resend fails)
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
          isDuplicate: res.is_duplicate || false,
        };
      }
    } catch (err: any) {
      console.warn("Supabase order error, using fallback pipeline:", err.message);
    }
  }

  // 3. Fallback Pipeline (Simulates atomic verification and stock decrement in-memory)
  if (idempotencyKey) {
    const existing = fallbackOrders.find((o) => (o as any).idempotencyKey === idempotencyKey);
    if (existing) {
      return {
        success: true,
        orderNumber: existing.order_number,
        receiptToken: existing.receipt_token,
        orderId: existing.id,
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

  // Decrement inventory atomically
  for (const item of items) {
    for (const p of INITIAL_PRODUCTS) {
      const v = p.variants?.find((x) => x.id === item.variantId);
      if (v) {
        v.inventory_quantity -= item.quantity;
      }
    }
  }

  const deliveryFee = calculateDeliveryFee(division, INITIAL_SETTINGS.dhaka_delivery_fee, INITIAL_SETTINGS.outside_dhaka_delivery_fee);
  const totalAmount = subtotal + deliveryFee;
  const orderNumber = generateOrderNumber();
  const receiptToken = generateReceiptToken();
  const orderId = `ord-${Date.now()}`;

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail || null,
    division,
    district,
    delivery_address: deliveryAddress,
    order_notes: orderNotes || null,
    payment_method: "cash_on_delivery",
    subtotal,
    delivery_fee: deliveryFee,
    total_amount: totalAmount,
    status: "pending",
    tracking_number: null,
    admin_notes: null,
    receipt_token: receiptToken,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: orderItems.map((oi) => ({ ...oi, order_id: orderId })),
  };

  (newOrder as any).idempotencyKey = idempotencyKey;
  fallbackOrders.unshift(newOrder);

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
    } catch {
      // Fallback
    }
  }
  return fallbackOrders.find((o) => o.id === orderId) || null;
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

      if (!error) return { success: true };
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
