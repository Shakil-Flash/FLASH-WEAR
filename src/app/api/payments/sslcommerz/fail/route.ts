import { NextResponse } from "next/server";
import { markPaymentFailedOrCancelled, fallbackTransactions } from "@/lib/payments/sslcommerz";
import { markOrderPaymentFailed, getOrderById } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let tranId = "";
    let errorMsg = "Payment declined by issuing bank or gateway";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tranId = (formData.get("tran_id") as string) || "";
      errorMsg = (formData.get("error") as string) || (formData.get("failedreason") as string) || errorMsg;
    } else {
      const body = await request.json().catch(() => ({}));
      tranId = body.tran_id || "";
      errorMsg = body.error || errorMsg;
    }

    if (tranId) {
      await markPaymentFailedOrCancelled(tranId, "failed", errorMsg);
      const tx = fallbackTransactions.find((t) => t.tran_id === tranId);
      if (tx?.order_id) {
        await markOrderPaymentFailed(tx.order_id, errorMsg);
        const order = await getOrderById(tx.order_id);
        if (order) {
          return NextResponse.redirect(
            new URL(
              `/order-confirmation/${order.order_number}?receipt_token=${order.receipt_token}&payment=failed&reason=${encodeURIComponent(errorMsg)}`,
              request.url
            ),
            303
          );
        }
      }
    }

    return NextResponse.redirect(new URL(`/checkout?payment_error=${encodeURIComponent(errorMsg)}`, request.url));
  } catch (err: any) {
    console.error("Payment fail callback error:", err);
    return NextResponse.redirect(new URL("/checkout?payment_error=payment_failed", request.url));
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tranId = url.searchParams.get("tran_id") || "";
  const errorMsg = url.searchParams.get("error") || "Payment could not be completed";

  if (tranId) {
    await markPaymentFailedOrCancelled(tranId, "failed", errorMsg);
    const tx = fallbackTransactions.find((t) => t.tran_id === tranId);
    if (tx?.order_id) {
      await markOrderPaymentFailed(tx.order_id, errorMsg);
      const order = await getOrderById(tx.order_id);
      if (order) {
        return NextResponse.redirect(
          new URL(
            `/order-confirmation/${order.order_number}?receipt_token=${order.receipt_token}&payment=failed&reason=${encodeURIComponent(errorMsg)}`,
            request.url
          ),
          303
        );
      }
    }
  }

  return NextResponse.redirect(new URL(`/checkout?payment_error=${encodeURIComponent(errorMsg)}`, request.url));
}
