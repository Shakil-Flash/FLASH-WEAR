import { NextResponse } from "next/server";
import { markPaymentFailedOrCancelled, fallbackTransactions } from "@/lib/payments/sslcommerz";
import { markOrderPaymentCancelled, getOrderById } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let tranId = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tranId = (formData.get("tran_id") as string) || "";
    } else {
      const body = await request.json().catch(() => ({}));
      tranId = body.tran_id || "";
    }

    if (tranId) {
      await markPaymentFailedOrCancelled(tranId, "cancelled", "Cancelled by customer");
      const tx = fallbackTransactions.find((t) => t.tran_id === tranId);
      if (tx?.order_id) {
        // Releases reserved stock
        await markOrderPaymentCancelled(tx.order_id);
        const order = await getOrderById(tx.order_id);
        if (order) {
          return NextResponse.redirect(
            new URL(
              `/order-confirmation/${order.order_number}?receipt_token=${order.receipt_token}&payment=cancelled`,
              request.url
            ),
            303
          );
        }
      }
    }

    return NextResponse.redirect(new URL("/cart?payment_notice=cancelled", request.url));
  } catch (err: any) {
    console.error("Payment cancel callback error:", err);
    return NextResponse.redirect(new URL("/cart?payment_notice=cancelled", request.url));
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tranId = url.searchParams.get("tran_id") || "";

  if (tranId) {
    await markPaymentFailedOrCancelled(tranId, "cancelled", "Cancelled by customer");
    const tx = fallbackTransactions.find((t) => t.tran_id === tranId);
    if (tx?.order_id) {
      await markOrderPaymentCancelled(tx.order_id);
      const order = await getOrderById(tx.order_id);
      if (order) {
        return NextResponse.redirect(
          new URL(
            `/order-confirmation/${order.order_number}?receipt_token=${order.receipt_token}&payment=cancelled`,
            request.url
          ),
          303
        );
      }
    }
  }

  return NextResponse.redirect(new URL("/cart?payment_notice=cancelled", request.url));
}
