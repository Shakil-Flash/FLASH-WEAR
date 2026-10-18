import React from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils/format-currency";
import { getOrderByNumberAndToken } from "@/lib/services/orders";
import {
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface OrderConfirmationPageProps {
  params: {
    orderNumber: string;
  };
  searchParams: {
    token?: string;
    receipt_token?: string;
    payment?: "success" | "failed" | "cancelled";
    reason?: string;
  };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const token = searchParams.token || searchParams.receipt_token;
  const paymentState = searchParams.payment;
  const failureReason = searchParams.reason;

  const order = token ? await getOrderByNumberAndToken(params.orderNumber, token) : null;

  return (
    <div className="bg-[#F7F5F0] min-h-screen py-12 sm:py-16 text-[#181818]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Payment Failure / Cancel Notice */}
        {paymentState === "failed" && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Online payment declined</p>
              <p className="text-xs text-red-600 mt-0.5">
                {failureReason || "The payment transaction could not be completed by your bank/gateway. You can retry payment or choose Cash on Delivery."}
              </p>
            </div>
          </div>
        )}

        {paymentState === "cancelled" && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Payment cancelled</p>
              <p className="text-xs text-amber-700 mt-0.5">
                You cancelled the hosted gateway payment. Reserved inventory has been safely restored.
              </p>
            </div>
          </div>
        )}

        {/* Success Header */}
        <div className="text-center space-y-3 pb-8 border-b border-[#E7E3DC]">
          <div className="w-16 h-16 rounded-full bg-[#FFF5F3] border border-[#FF5938]/30 flex items-center justify-center mx-auto text-[#FF5938] shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF5938]">
              {order?.payment_status === "paid" ? "Online Payment Confirmed" : "Order Successfully Placed"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181818] mt-1">
              Thank You For Your Order
            </h1>
          </div>
          <p className="text-sm text-[#74716D] max-w-lg mx-auto leading-relaxed">
            Your pieces are registered in our inventory and are currently being prepared for dispatch.
          </p>

          <div className="inline-block mt-2 px-4 py-2 bg-white rounded-lg border border-[#E7E3DC] text-xs shadow-xs">
            <span className="text-[#74716D]">Order reference: </span>
            <strong className="text-[#181818] font-bold text-sm tracking-wider">{params.orderNumber}</strong>
          </div>
        </div>

        {/* Detailed Receipt View if valid token provided */}
        {order ? (
          <div className="mt-8 space-y-6">
            {/* Status Pipeline */}
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-3">
                <h2 className="text-xs uppercase tracking-wider font-bold text-[#181818]">
                  Fulfillment Status: <span className="text-[#FF5938] capitalize">{order.status}</span>
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 font-medium rounded-full ${
                    order.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  Payment: {order.payment_status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC]">
                  <span className="text-[#74716D] block">Payment Method</span>
                  <strong className="text-[#181818] text-sm">
                    {order.payment_method === "sslcommerz" ? "Online (SSLCOMMERZ)" : "Cash on Delivery"}
                  </strong>
                </div>
                <div className="p-3.5 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC]">
                  <span className="text-[#74716D] block">Estimated Delivery</span>
                  <strong className="text-[#181818] text-sm">
                    {order.division === "Dhaka" ? "24 - 48 Hours" : "48 - 72 Hours"}
                  </strong>
                </div>
                <div className="p-3.5 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC]">
                  <span className="text-[#74716D] block">
                    {order.payment_status === "paid" ? "Total Paid Online" : "Payable at Doorstep"}
                  </span>
                  <strong className="text-[#FF5938] text-base">{formatBDT(order.total_amount)}</strong>
                </div>
              </div>
            </div>

            {/* Courier Tracking Details */}
            {order.courier_consignment_id && (
              <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DC]">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#FF5938]" />
                    <h2 className="text-xs uppercase tracking-wider font-bold text-[#181818]">
                      Courier Shipment Dispatched
                    </h2>
                  </div>
                  {order.courier_tracking_url && (
                    <a
                      href={order.courier_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#FF5938] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Track on {order.courier_name}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs text-[#181818] space-y-1">
                  <p>Consignment ID: <strong className="text-[#FF5938]">{order.courier_consignment_id}</strong></p>
                  <p>Carrier: <strong className="text-[#181818]">{order.courier_name}</strong></p>
                </div>
              </div>
            )}

            {/* Delivery Details */}
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-[#181818] border-b border-[#E7E3DC] pb-2">
                Delivery Recipient
              </h2>
              <div className="text-xs text-[#181818] space-y-1.5 leading-relaxed">
                <p><span className="text-[#74716D]">Name:</span> {order.customer_name}</p>
                <p><span className="text-[#74716D]">Phone:</span> {order.customer_phone}</p>
                {order.customer_email && (
                  <p><span className="text-[#74716D]">Email:</span> {order.customer_email}</p>
                )}
                <p><span className="text-[#74716D]">Location:</span> {order.district}, {order.division}</p>
                <p><span className="text-[#74716D]">Address:</span> {order.delivery_address}</p>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-4">
              <h2 className="text-xs uppercase tracking-wider font-bold text-[#181818] border-b border-[#E7E3DC] pb-2">
                Purchased Apparel
              </h2>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-[#E7E3DC]/60 last:border-b-0 text-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-[#181818]">{item.product_name}</h4>
                      <p className="text-[11px] text-[#74716D]">
                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium text-[#181818]">
                      {formatBDT(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price summary */}
              <div className="pt-3 border-t border-[#E7E3DC] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#74716D]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#181818]">{formatBDT(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({order.coupon_code || "COUPON"})</span>
                    <span>-{formatBDT(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#74716D]">
                  <span>Courier Delivery Fee ({order.division})</span>
                  <span className="font-medium text-[#181818]">{formatBDT(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-[#181818] font-bold text-sm pt-2 border-t border-[#E7E3DC]">
                  <span>Total Amount</span>
                  <span className="text-[#FF5938] text-base">{formatBDT(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Minimal Protected View if token is omitted */
          <div className="mt-8 p-8 bg-white border border-[#E7E3DC] rounded-xl text-center space-y-3 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-[#FF5938] mx-auto" />
            <h3 className="text-sm uppercase tracking-wider font-bold text-[#181818]">
              Private Order Summary Protected
            </h3>
            <p className="text-xs text-[#74716D] max-w-md mx-auto leading-relaxed">
              Order {params.orderNumber} is registered. To view customer details and parcel tracking, please open the receipt link sent to your phone or email.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/account/orders"
            className="w-full sm:w-auto px-6 py-3 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>View in my account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] font-medium text-xs rounded-lg flex items-center justify-center transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
