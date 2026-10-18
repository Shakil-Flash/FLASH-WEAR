import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { PaymentTransaction } from "../types";

export interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  isSandbox: boolean;
  baseUrl: string;
  siteUrl: string;
}

export function getSSLCommerzConfig(): SSLCommerzConfig {
  const storeId = process.env.SSLCOMMERZ_STORE_ID || "";
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD || "";
  const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
  const baseUrl = isSandbox
    ? "https://sandbox.sslcommerz.com"
    : "https://securepay.sslcommerz.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    storeId,
    storePassword,
    isSandbox,
    baseUrl,
    siteUrl,
  };
}

export function isSSLCommerzConfigured(): boolean {
  const cfg = getSSLCommerzConfig();
  return Boolean(cfg.storeId && cfg.storePassword);
}

// In-memory transactions storage for local testing without DB
export const fallbackTransactions: PaymentTransaction[] = [];

export interface InitPaymentInput {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  deliveryAddress: string;
  division: string;
  district: string;
}

export interface InitPaymentResult {
  success: boolean;
  redirectUrl?: string;
  tranId?: string;
  sessionKey?: string;
  error?: string;
}

export async function initiateSSLCommerzPayment(
  input: InitPaymentInput
): Promise<InitPaymentResult> {
  const config = getSSLCommerzConfig();
  const tranId = `FW-${input.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

  // Record initial transaction attempt
  const txRecord: PaymentTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: input.orderId,
    gateway: "sslcommerz",
    tran_id: tranId,
    amount: input.totalAmount,
    currency: "BDT",
    status: "initiated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin.from("payment_transactions").insert({
        order_id: txRecord.order_id,
        gateway: txRecord.gateway,
        tran_id: txRecord.tran_id,
        amount: txRecord.amount,
        currency: txRecord.currency,
        status: txRecord.status,
      });
    } catch (err) {
      console.warn("DB payment_transactions insert error:", err);
    }
  }
  fallbackTransactions.unshift(txRecord);

  // If real credentials are provided, call SSLCOMMERZ Session API
  if (isSSLCommerzConfigured()) {
    try {
      const postBody = new URLSearchParams({
        store_id: config.storeId,
        store_passwd: config.storePassword,
        total_amount: input.totalAmount.toFixed(2),
        currency: "BDT",
        tran_id: tranId,
        success_url: `${config.siteUrl}/api/payments/sslcommerz/success`,
        fail_url: `${config.siteUrl}/api/payments/sslcommerz/fail`,
        cancel_url: `${config.siteUrl}/api/payments/sslcommerz/cancel`,
        ipn_url: `${config.siteUrl}/api/payments/sslcommerz/ipn`,
        shipping_method: "Courier",
        product_name: "FLASHWEAR Streetwear Apparel",
        product_category: "Clothing",
        product_profile: "physical-goods",
        cus_name: input.customerName,
        cus_email: input.customerEmail || "customer@flashwear.store",
        cus_add1: input.deliveryAddress,
        cus_city: input.district,
        cus_state: input.division,
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: input.customerPhone,
        ship_name: input.customerName,
        ship_add1: input.deliveryAddress,
        ship_city: input.district,
        ship_country: "Bangladesh",
      });

      const response = await fetch(`${config.baseUrl}/gwprocess/v4/api.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postBody.toString(),
      });

      const data = await response.json();

      if (data.status === "SUCCESS" && data.GatewayPageURL) {
        return {
          success: true,
          redirectUrl: data.GatewayPageURL,
          tranId,
          sessionKey: data.sessionkey,
        };
      } else {
        console.warn("SSLCommerz initiation response failed:", data.failedreason || data);
      }
    } catch (err: any) {
      console.error("SSLCommerz API request error:", err.message);
    }
  }

  // When credentials are not yet configured or in mock/test sandbox, provide high-fidelity interactive mock gateway
  const isProd = process.env.NODE_ENV === "production";
  const allowMock = process.env.ENABLE_MOCK_PAYMENT_GATEWAY === "true" || !isProd;
  if (!allowMock) {
    return {
      success: false,
      error: "Online payment gateway is not configured for production. Please configure SSLCOMMERZ credentials or choose Cash on Delivery.",
    };
  }

  const mockRedirectUrl = `${config.siteUrl}/api/payments/sslcommerz/mock-gateway?tran_id=${tranId}&amount=${input.totalAmount}&order_id=${input.orderId}&order_number=${input.orderNumber}`;

  return {
    success: true,
    redirectUrl: mockRedirectUrl,
    tranId,
    sessionKey: `mock_session_${Date.now()}`,
  };
}

export interface ValidationResult {
  success: boolean;
  isValidated: boolean;
  orderId?: string;
  orderNumber?: string;
  tranId?: string;
  valId?: string;
  amount?: number;
  cardType?: string;
  bankTranId?: string;
  error?: string;
}

export async function validateSSLCommerzPayment(
  valId: string,
  tranId: string
): Promise<ValidationResult> {
  const config = getSSLCommerzConfig();

  // Find transaction
  let tx = fallbackTransactions.find((t) => t.tran_id === tranId);
  if (!tx && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("payment_transactions")
        .select("*")
        .eq("tran_id", tranId)
        .single();
      if (data) tx = data as PaymentTransaction;
    } catch {}
  }

  if (!tx) {
    return { success: false, isValidated: false, error: "Transaction not found" };
  }

  // Idempotency: If already validated
  if (tx.status === "validated") {
    return {
      success: true,
      isValidated: true,
      orderId: tx.order_id,
      tranId: tx.tran_id,
      valId: tx.val_id || valId,
      amount: tx.amount,
      cardType: tx.card_type || "VISA",
      bankTranId: tx.bank_tran_id || "BANK-SUCCESS",
    };
  }

  // If live SSLCOMMERZ credentials exist, query SSLCOMMERZ Validation API
  if (isSSLCommerzConfigured()) {
    try {
      const queryParams = new URLSearchParams({
        val_id: valId,
        store_id: config.storeId,
        store_passwd: config.storePassword,
        v: "1",
        format: "json",
      });

      const response = await fetch(
        `${config.baseUrl}/validator/api/validationserverAPI.php?${queryParams.toString()}`,
        { method: "GET" }
      );
      const data = await response.json();

      // Check status
      if (data.status !== "VALID" && data.status !== "VALIDATED") {
        return {
          success: false,
          isValidated: false,
          error: `Gateway status is ${data.status}: ${data.error || "Payment not approved"}`,
        };
      }

      // Currency check
      if (data.currency !== "BDT") {
        return {
          success: false,
          isValidated: false,
          error: `Currency mismatch: Expected BDT, got ${data.currency}`,
        };
      }

      // Amount verification (allow 0.01 precision difference)
      const verifiedAmount = parseFloat(data.amount);
      if (Math.abs(verifiedAmount - tx.amount) > 0.05) {
        return {
          success: false,
          isValidated: false,
          error: `Amount mismatch: Expected ৳${tx.amount}, gateway reported ৳${verifiedAmount}`,
        };
      }

      // Verified!
      tx.status = "validated";
      tx.val_id = valId;
      tx.card_type = data.card_type || "ONLINE";
      tx.bank_tran_id = data.bank_tran_id || null;
      tx.card_brand = data.card_brand || null;
      tx.card_issuer = data.card_issuer || null;
      tx.raw_response = data;
      tx.updated_at = new Date().toISOString();

      return {
        success: true,
        isValidated: true,
        orderId: tx.order_id,
        tranId: tx.tran_id,
        valId,
        amount: verifiedAmount,
        cardType: tx.card_type || undefined,
        bankTranId: tx.bank_tran_id || undefined,
      };
    } catch (err: any) {
      console.error("SSLCommerz validator fetch error:", err.message);
      return { success: false, isValidated: false, error: "Validation server connection failed" };
    }
  }

  // Mock / Sandbox Validation Flow
  const isProd = process.env.NODE_ENV === "production";
  const allowMock = process.env.ENABLE_MOCK_PAYMENT_GATEWAY === "true" || !isProd;
  if (!allowMock) {
    return {
      success: false,
      isValidated: false,
      error: "Mock payment validation is strictly disabled in production.",
    };
  }

  tx.status = "validated";
  tx.val_id = valId || `VAL-${Date.now()}`;
  tx.card_type = "BKASH-Mock";
  tx.bank_tran_id = `BANK-${Date.now()}`;
  tx.updated_at = new Date().toISOString();

  return {
    success: true,
    isValidated: true,
    orderId: tx.order_id,
    tranId: tx.tran_id,
    valId: tx.val_id,
    amount: tx.amount,
    cardType: tx.card_type,
    bankTranId: tx.bank_tran_id,
  };
}

export async function markPaymentFailedOrCancelled(
  tranId: string,
  status: "failed" | "cancelled",
  reason?: string
) {
  let tx = fallbackTransactions.find((t) => t.tran_id === tranId);
  if (!tx && isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("payment_transactions")
        .select("*")
        .eq("tran_id", tranId)
        .single();
      if (data) tx = data as PaymentTransaction;
    } catch {}
  }

  if (tx) {
    tx.status = status;
    tx.error_reason = reason || null;
    tx.updated_at = new Date().toISOString();
  }

  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("payment_transactions")
        .update({
          status,
          error_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("tran_id", tranId);
    } catch {}
  }
}
