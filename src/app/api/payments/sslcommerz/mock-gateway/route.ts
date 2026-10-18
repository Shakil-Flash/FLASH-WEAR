import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isProd = process.env.NODE_ENV === "production";
  const allowMock = process.env.ENABLE_MOCK_PAYMENT_GATEWAY === "true" || !isProd;

  if (!allowMock) {
    return new NextResponse(
      JSON.stringify({
        error: "Mock payment gateway is strictly disabled in production environments.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const tranId = url.searchParams.get("tran_id") || "";
  const amount = url.searchParams.get("amount") || "0";
  const orderNumber = url.searchParams.get("order_number") || "";
  const orderId = url.searchParams.get("order_id") || "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSLCOMMERZ Hosted Payment Sandbox | FLASHWEAR</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0c0e; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #141417; border: 1px solid #27272a; border-radius: 12px; width: 100%; max-width: 480px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: #1f1f23; padding: 20px 24px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
    .logo-area { display: flex; align-items: center; gap: 8px; font-weight: 800; letter-spacing: -0.5px; font-size: 18px; color: #ccff00; }
    .sandbox-tag { background: #f59e0b; color: #000; font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 4px; text-transform: uppercase; }
    .content { padding: 24px; }
    .amount-box { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; }
    .amount-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 4px; }
    .amount-val { font-size: 32px; font-weight: 800; color: #ccff00; font-family: monospace; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; color: #a1a1aa; margin-bottom: 8px; border-bottom: 1px dashed #27272a; padding-bottom: 8px; }
    .info-val { color: #f4f4f5; font-family: monospace; font-weight: 600; }
    .method-group { margin: 20px 0; }
    .method-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 12px; }
    .channel-chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
    .chip { background: #1f1f23; border: 1px solid #3f3f46; padding: 12px 8px; border-radius: 8px; text-align: center; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .chip:hover, .chip.active { border-color: #ccff00; background: #27272a; color: #ccff00; }
    .actions { display: flex; flex-direction: column; gap: 10px; }
    .btn { width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: opacity 0.2s; }
    .btn-pay { background: #ccff00; color: #000; }
    .btn-pay:hover { opacity: 0.9; }
    .btn-fail { background: #ef4444; color: #fff; }
    .btn-cancel { background: transparent; border: 1px solid #3f3f46; color: #a1a1aa; }
    .btn-cancel:hover { color: #fff; border-color: #71717a; }
    .footer-note { font-size: 11px; color: #71717a; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-area">
        <span>SSLCOMMERZ</span>
      </div>
      <span class="sandbox-tag">Sandbox Gateway</span>
    </div>
    <div class="content">
      <div class="amount-box">
        <div class="amount-label">Payable Amount</div>
        <div class="amount-val">৳${Number(amount).toLocaleString()}</div>
      </div>
      <div class="info-row">
        <span>Merchant</span>
        <span class="info-val">FLASHWEAR BD</span>
      </div>
      <div class="info-row">
        <span>Order Number</span>
        <span class="info-val">${orderNumber}</span>
      </div>
      <div class="info-row">
        <span>Transaction ID</span>
        <span class="info-val">${tranId}</span>
      </div>

      <div class="method-group">
        <div class="method-title">Select Payment Channel</div>
        <div class="channel-chips">
          <div class="chip active">bKash</div>
          <div class="chip">Nagad</div>
          <div class="chip">Card / Visa</div>
        </div>
      </div>

      <div class="actions">
        <form method="POST" action="/api/payments/sslcommerz/success">
          <input type="hidden" name="tran_id" value="${tranId}">
          <input type="hidden" name="val_id" value="VAL_${Date.now()}">
          <input type="hidden" name="amount" value="${amount}">
          <input type="hidden" name="card_type" value="BKASH-Sandbox">
          <button type="submit" class="btn btn-pay">✓ Complete Payment (Success)</button>
        </form>

        <form method="POST" action="/api/payments/sslcommerz/fail">
          <input type="hidden" name="tran_id" value="${tranId}">
          <input type="hidden" name="error" value="Customer account balance insufficient">
          <button type="submit" class="btn btn-fail">✕ Simulate Payment Failure</button>
        </form>

        <form method="POST" action="/api/payments/sslcommerz/cancel">
          <input type="hidden" name="tran_id" value="${tranId}">
          <button type="submit" class="btn btn-cancel">Cancel & Return to Store</button>
        </form>
      </div>

      <p class="footer-note">This is the secure test harness for SSLCOMMERZ hosted payments. No real bank accounts or credit cards are charged.</p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
