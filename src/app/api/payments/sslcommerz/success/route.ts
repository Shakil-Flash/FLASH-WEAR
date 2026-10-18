import { NextResponse } from "next/server";
import { validateSSLCommerzPayment } from "@/lib/payments/sslcommerz";
import { markOrderPaid, getOrderById } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let tranId = "";
    let valId = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tranId = (formData.get("tran_id") as string) || "";
      valId = (formData.get("val_id") as string) || "";
    } else {
      const body = await request.json().catch(() => ({}));
      tranId = body.tran_id || "";
      valId = body.val_id || "";
    }

    if (!tranId) {
      return NextResponse.redirect(new URL("/cart?payment_error=missing_transaction", request.url));
    }

    // SERVER-SIDE VALIDATION: Never trust client payload alone
    const validation = await validateSSLCommerzPayment(valId, tranId);

    if (!validation.isValidated || !validation.orderId) {
      console.warn("Payment validation failed:", validation.error);
      return NextResponse.redirect(
        new URL(`/cart?payment_error=${encodeURIComponent(validation.error || "Payment verification failed")}`, request.url)
      );
    }

    // Idempotently mark order as paid
    await markOrderPaid(validation.orderId, {
      tranId,
      valId: validation.valId || valId,
      amount: validation.amount || 0,
      cardType: validation.cardType,
    });

    const order = await getOrderById(validation.orderId);
    if (!order) {
      return NextResponse.redirect(new URL("/cart?payment_error=order_not_found", request.url));
    }

    // Secure redirection with receipt token
    return NextResponse.redirect(
      new URL(
        `/order-confirmation/${order.order_number}?receipt_token=${order.receipt_token}&payment=success`,
        request.url
      ),
      303
    );
  } catch (err: any) {
    console.error("Payment success callback error:", err);
    return NextResponse.redirect(new URL("/cart?payment_error=internal_error", request.url));
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tranId = url.searchParams.get("tran_id") || "";
  const valId = url.searchParams.get("val_id") || "";

  if (!tranId) {
    return NextResponse.redirect(new URL("/cart?payment_error=missing_transaction", request.url));
  }

  const validation = await validateSSLCommerzPayment(valId, tranId);
  if (!validation.isValidated || !validation.orderId) {
    return NextResponse.redirect(
      new URL(`/cart?payment_error=${encodeURIComponent(validation.error || "Payment verification failed")}`, request.url)
    );
  }

  await markOrderPaid(validation.orderId, {
    tranId,
    valId: validation.valId || valId,
    amount: validation.amount || 0,
    cardType: validation.cardType,
  });

  const order = await getOrderById(validation.orderId);
  if (!order) {
    return NextResponse.redirect(new URL("/cart?payment_error=order_not_found", request.url));
  }

  return NextResponse.redirect(
    new URL(
      `/order-confirmation/${order.order_number}?receipt_token=${order.receipt_token}&payment=success`,
      request.url
    ),
    303
  );
}
