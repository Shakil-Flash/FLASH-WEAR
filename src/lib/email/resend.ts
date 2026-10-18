import { Resend } from "resend";
import { formatBDT } from "../utils/format-currency";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.STORE_FROM_EMAIL || "orders@flashwear.store";
const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@flashwear.store";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  division: string;
  district: string;
  deliveryAddress: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  items: {
    productName: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY is not configured. Email notification skipped." };
  }

  if (!order.customerEmail) {
    return { sent: false, reason: "Customer email not provided" };
  }

  try {
    const itemsTable = order.items
      .map(
        (i) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #ffffff;">
            <strong>${i.productName}</strong><br/>
            <span style="color: #a1a1aa; font-size: 13px;">Size: ${i.size} | Color: ${i.color} x ${i.quantity}</span>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; text-align: right; color: #ccff00; font-weight: bold;">
            ${formatBDT(i.lineTotal)}
          </td>
        </tr>
      `
      )
      .join("");

    await resend.emails.send({
      from: `FLASHWEAR <${fromEmail}>`,
      to: order.customerEmail,
      subject: `Order Confirmed: ${order.orderNumber} | FLASHWEAR`,
      html: `
        <div style="background-color: #0a0a0b; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
          <div style="border-bottom: 2px solid #ccff00; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 2px;">FLASHWEAR</h1>
            <p style="color: #a1a1aa; font-size: 14px; margin: 5px 0 0;">ORDER CONFIRMATION</p>
          </div>
          
          <p style="font-size: 16px;">Hello ${order.customerName},</p>
          <p style="color: #d4d4d8; line-height: 1.6;">
            Thank you for ordering with FLASHWEAR. Your order <strong>${order.orderNumber}</strong> has been received and is being prepared for dispatch.
          </p>
          
          <div style="background-color: #121214; border: 1px solid #27272a; padding: 20px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #ccff00; font-size: 14px; letter-spacing: 1px;">ORDER SUMMARY</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsTable}
              <tr>
                <td style="padding-top: 15px; color: #a1a1aa;">Subtotal</td>
                <td style="padding-top: 15px; text-align: right; color: #ffffff;">${formatBDT(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #a1a1aa;">Delivery (${order.division})</td>
                <td style="padding: 5px 0; text-align: right; color: #ffffff;">${formatBDT(order.deliveryFee)}</td>
              </tr>
              <tr>
                <td style="padding-top: 10px; font-weight: bold; color: #ffffff; font-size: 16px;">Total Amount</td>
                <td style="padding-top: 10px; text-align: right; color: #ccff00; font-weight: bold; font-size: 18px;">${formatBDT(order.totalAmount)}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #18181b; padding: 15px; border-left: 3px solid #ccff00; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 13px; color: #d4d4d8;">
              Delivery to: ${order.deliveryAddress}, ${order.district}.
            </p>
          </div>

          <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 40px;">
            FLASHWEAR BANGLADESH &bull; Built for the modern silhouette.
          </p>
        </div>
      `,
    });

    return { sent: true };
  } catch (error: any) {
    console.error("Failed to send order confirmation email:", error.message);
    return { sent: false, reason: error.message };
  }
}

export async function sendAdminNewOrderEmail(order: OrderEmailData): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: `FLASHWEAR Store <${fromEmail}>`,
      to: adminEmail,
      subject: `[NEW ORDER] ${order.orderNumber} - ${formatBDT(order.totalAmount)}`,
      html: `
        <div style="font-family: sans-serif; background: #0a0a0b; color: #ffffff; padding: 25px;">
          <h2 style="color: #ccff00;">New Order Received</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
          <p><strong>Division / District:</strong> ${order.division} / ${order.district}</p>
          <p><strong>Total Amount:</strong> ${formatBDT(order.totalAmount)}</p>
          <p><strong>Items:</strong> ${order.items.length} item(s)</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders" style="color: #ccff00;">Open in Admin Dashboard</a></p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message };
  }
}

export async function sendPaymentSuccessEmail(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  tranId: string;
  paymentChannel: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not configured" };

  try {
    await resend.emails.send({
      from: `FLASHWEAR Payments <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Payment Confirmed: ${data.orderNumber} | FLASHWEAR`,
      html: `
        <div style="background: #0a0a0b; color: #fff; font-family: sans-serif; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ccff00; margin-top: 0;">Payment Verified Successfully</h2>
          <p>Hello ${data.customerName},</p>
          <p>We have successfully verified your payment of <strong>${formatBDT(data.amount)}</strong> for order <strong>${data.orderNumber}</strong>.</p>
          <div style="background: #141417; border: 1px solid #27272a; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Transaction ID:</strong> ${data.tranId}</p>
            <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${data.paymentChannel}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> PAID</p>
          </div>
          <p style="color: #a1a1aa; font-size: 13px;">Your order is now being processed for shipping. Thank you for shopping with FLASHWEAR!</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message };
  }
}

export async function sendShipmentDispatchedEmail(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  courierName: string;
  consignmentId: string;
  trackingUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not configured" };

  try {
    await resend.emails.send({
      from: `FLASHWEAR Dispatch <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Your Order Has Shipped: ${data.orderNumber} | FLASHWEAR`,
      html: `
        <div style="background: #0a0a0b; color: #fff; font-family: sans-serif; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ccff00; margin-top: 0;">Your Package is on the Way!</h2>
          <p>Hello ${data.customerName},</p>
          <p>Your order <strong>${data.orderNumber}</strong> has been handed over to our courier partner <strong>${data.courierName}</strong>.</p>
          <div style="background: #141417; border: 1px solid #27272a; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Courier:</strong> ${data.courierName}</p>
            <p style="margin: 4px 0;"><strong>Consignment / Tracking Number:</strong> ${data.consignmentId}</p>
            ${data.trackingUrl ? `<p style="margin: 8px 0;"><a href="${data.trackingUrl}" style="color: #ccff00; text-decoration: underline;">Track Shipment Live &rarr;</a></p>` : ""}
          </div>
        </div>
      `,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message };
  }
}

export async function sendReturnStatusUpdatedEmail(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  requestType: string;
  status: string;
  adminNotes?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not configured" };

  try {
    await resend.emails.send({
      from: `FLASHWEAR Support <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Update on your ${data.requestType} request: ${data.orderNumber} | FLASHWEAR`,
      html: `
        <div style="background: #0a0a0b; color: #fff; font-family: sans-serif; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ccff00; margin-top: 0;">${data.requestType.toUpperCase()} Request Status Update</h2>
          <p>Hello ${data.customerName},</p>
          <p>Your ${data.requestType} request for order <strong>${data.orderNumber}</strong> is now: <strong style="color: #ccff00; text-transform: uppercase;">${data.status}</strong>.</p>
          ${data.adminNotes ? `<p><strong>Notes from our team:</strong> ${data.adminNotes}</p>` : ""}
        </div>
      `,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message };
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Email Log] To: ${options.to} | Subject: ${options.subject}`);
    }
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    await resend.emails.send({
      from: `FLASHWEAR <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err.message };
  }
}

