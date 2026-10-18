import { NextResponse } from "next/server";
import { validateSSLCommerzPayment } from "@/lib/payments/sslcommerz";
import { markOrderPaid } from "@/lib/services/orders";

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

    if (!tranId || !valId) {
      return NextResponse.json(
        { error: "Missing tran_id or val_id in IPN payload" },
        { status: 400 }
      );
    }

    // Server-to-server independent verification
    const validation = await validateSSLCommerzPayment(valId, tranId);

    if (!validation.isValidated || !validation.orderId) {
      console.warn("IPN verification declined:", validation.error);
      return NextResponse.json(
        { error: validation.error || "Verification failed" },
        { status: 400 }
      );
    }

    // Idempotent processing
    await markOrderPaid(validation.orderId, {
      tranId,
      valId,
      amount: validation.amount || 0,
      cardType: validation.cardType,
    });

    return NextResponse.json({
      received: true,
      status: "PROCESSED",
      orderId: validation.orderId,
      tranId,
    });
  } catch (err: any) {
    console.error("SSLCommerz IPN error:", err);
    return NextResponse.json(
      { error: err.message || "IPN handling exception" },
      { status: 500 }
    );
  }
}
