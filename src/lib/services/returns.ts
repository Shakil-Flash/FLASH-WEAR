import { ReturnRequest, ReturnRequestedItem, ReturnStatus, ReturnRequestType } from "../types";
import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { INITIAL_PRODUCTS } from "../data/mock-catalog";
import { getOrderById } from "./orders";
import { sendReturnStatusUpdatedEmail } from "../email/resend";

export const fallbackReturns: ReturnRequest[] = [];

export interface CreateReturnInput {
  orderId: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestType: ReturnRequestType;
  items: ReturnRequestedItem[];
  reason: string;
  customerNotes?: string;
  imageUrls?: string[];
}

export async function createReturnRequest(
  input: CreateReturnInput
): Promise<{ success: boolean; returnId?: string; error?: string }> {
  // 1. Verify that order exists
  const order = await getOrderById(input.orderId);
  if (!order) {
    return { success: false, error: "Associated order could not be found" };
  }

  // 2. Eligibility checks
  // Returns/exchanges eligible if delivered or shipped
  if (order.status === "cancelled") {
    return { success: false, error: "Cannot request return/exchange for a cancelled order" };
  }

  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Please select at least one item to return or exchange" };
  }

  const returnId = `ret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newReturn: ReturnRequest = {
    id: returnId,
    order_id: input.orderId,
    order_number: input.orderNumber,
    user_id: input.userId || order.user_id || null,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    request_type: input.requestType,
    items: input.items,
    reason: input.reason,
    customer_notes: input.customerNotes || null,
    image_urls: input.imageUrls || [],
    status: "requested",
    inspection_outcome: null,
    is_restocked: false,
    refund_amount: 0,
    refund_status: "unrefunded",
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("return_requests")
        .insert({
          order_id: newReturn.order_id,
          order_number: newReturn.order_number,
          user_id: newReturn.user_id,
          customer_name: newReturn.customer_name,
          customer_email: newReturn.customer_email,
          customer_phone: newReturn.customer_phone,
          request_type: newReturn.request_type,
          items: newReturn.items,
          reason: newReturn.reason,
          customer_notes: newReturn.customer_notes,
          image_urls: newReturn.image_urls,
          status: newReturn.status,
          is_restocked: newReturn.is_restocked,
          refund_amount: newReturn.refund_amount,
          refund_status: newReturn.refund_status,
        })
        .select()
        .single();

      if (!error && data) {
        return { success: true, returnId: data.id };
      }
    } catch (err: any) {
      console.warn("DB return_requests insert error:", err.message);
    }
  }

  fallbackReturns.unshift(newReturn);

  // Notify customer
  sendReturnStatusUpdatedEmail({
    orderNumber: newReturn.order_number,
    customerName: newReturn.customer_name,
    customerEmail: newReturn.customer_email,
    requestType: newReturn.request_type,
    status: "Received & Under Review",
    adminNotes: "Your request has been logged. Our dispatch team will review within 24-48 business hours.",
  }).catch(() => {});

  return { success: true, returnId };
}

export async function getReturnRequests(
  statusFilter?: string,
  search?: string
): Promise<ReturnRequest[]> {
  if (isServiceRoleConfigured()) {
    try {
      let query = supabaseAdmin
        .from("return_requests")
        .select("*")
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
        return data as ReturnRequest[];
      }
    } catch {}
  }

  let list = [...fallbackReturns];
  if (statusFilter && statusFilter !== "all") {
    list = list.filter((r) => r.status === statusFilter);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.order_number.toLowerCase().includes(s) ||
        r.customer_name.toLowerCase().includes(s) ||
        r.customer_phone.includes(s)
    );
  }
  return list;
}

export async function getReturnRequestById(id: string): Promise<ReturnRequest | null> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("return_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        return data as ReturnRequest;
      }
    } catch {}
  }
  return fallbackReturns.find((r) => r.id === id) || null;
}

export async function getCustomerReturnRequests(userId: string): Promise<ReturnRequest[]> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("return_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as ReturnRequest[];
      }
    } catch {}
  }
  return fallbackReturns.filter((r) => r.user_id === userId);
}

export async function updateReturnRequestStatus(
  id: string,
  status: ReturnStatus,
  updateData?: {
    adminNotes?: string;
    inspectionOutcome?: string;
    refundAmount?: number;
    refundStatus?: "unrefunded" | "pending" | "processed" | "declined";
  }
): Promise<{ success: boolean; error?: string }> {
  const req = await getReturnRequestById(id);
  if (!req) return { success: false, error: "Return request not found" };

  if (isServiceRoleConfigured()) {
    try {
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (updateData?.adminNotes !== undefined) updatePayload.admin_notes = updateData.adminNotes;
      if (updateData?.inspectionOutcome !== undefined) updatePayload.inspection_outcome = updateData.inspectionOutcome;
      if (updateData?.refundAmount !== undefined) updatePayload.refund_amount = updateData.refundAmount;
      if (updateData?.refundStatus !== undefined) updatePayload.refund_status = updateData.refundStatus;

      const { error } = await supabaseAdmin
        .from("return_requests")
        .update(updatePayload)
        .eq("id", id);

      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  req.status = status;
  if (updateData?.adminNotes !== undefined) req.admin_notes = updateData.adminNotes;
  if (updateData?.inspectionOutcome !== undefined) req.inspection_outcome = updateData.inspectionOutcome;
  if (updateData?.refundAmount !== undefined) req.refund_amount = updateData.refundAmount;
  if (updateData?.refundStatus !== undefined) req.refund_status = updateData.refundStatus;
  req.updated_at = new Date().toISOString();

  // Notify customer of status change
  sendReturnStatusUpdatedEmail({
    orderNumber: req.order_number,
    customerName: req.customer_name,
    customerEmail: req.customer_email,
    requestType: req.request_type,
    status: status.replace("_", " "),
    adminNotes: updateData?.adminNotes,
  }).catch(() => {});

  return { success: true };
}

/**
 * RESTOCK INVENTORY UPON PHYSICAL GOODS INSPECTION & APPROVAL
 * Critical: Never restore stock when request is merely submitted!
 */
export async function restockReturnedItems(
  returnId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const req = await getReturnRequestById(returnId);
  if (!req) return { success: false, error: "Return request not found" };

  if (req.is_restocked) {
    return { success: false, error: "Items for this return have already been restocked" };
  }

  // Stock can only be restocked once physically received and inspected
  if (!["received", "inspected", "completed"].includes(req.status)) {
    return {
      success: false,
      error: `Cannot restock items before physical goods are inspected. Current status: ${req.status}`,
    };
  }

  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin.rpc("restock_returned_items_atomic", {
        p_return_id: returnId,
        p_admin_notes: adminNotes || "Restocked into active inventory after QA inspection",
      });
      if (!error && (data as any)?.success) {
        req.is_restocked = true;
        return { success: true };
      }
      if (error) return { success: false, error: error.message };
    } catch {}
  }

  // Fallback stock restoration
  for (const item of req.items) {
    for (const p of INITIAL_PRODUCTS) {
      const v = p.variants?.find((x) => x.id === item.variant_id);
      if (v) {
        v.inventory_quantity += item.quantity;
      }
    }
  }

  req.is_restocked = true;
  if (adminNotes) {
    req.admin_notes = (req.admin_notes ? req.admin_notes + "\n" : "") + adminNotes;
  }
  req.updated_at = new Date().toISOString();

  return { success: true };
}
