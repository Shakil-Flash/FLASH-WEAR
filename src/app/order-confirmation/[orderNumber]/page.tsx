import React from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils/format-currency";
import { getOrderByNumberAndToken } from "@/lib/services/orders";
import { CheckCircle2, Package, Truck, ShieldCheck, ArrowRight, Printer } from "lucide-react";

interface OrderConfirmationPageProps {
  params: {
    orderNumber: string;
  };
  searchParams: {
    token?: string;
  };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const token = searchParams.token;
  const order = token ? await getOrderByNumberAndToken(params.orderNumber, token) : null;

  return (
    <div className="bg-[#0a0a0b] min-h-screen py-16 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center space-y-4 pb-10 border-b border-zinc-800">
          <div className="w-16 h-16 rounded-full bg-[#ccff00]/10 border-2 border-[#ccff00] flex items-center justify-center mx-auto text-[#ccff00]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
              Cash On Delivery Confirmed
            </span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-1">
              Order Received
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Thank you for ordering with FLASHWEAR. Your order is registered in our inventory system and is currently being prepared for courier pickup.
          </p>

          <div className="inline-block p-3 bg-zinc-900 border border-zinc-800 font-mono text-xs">
            <span className="text-zinc-500">Order Reference: </span>
            <strong className="text-white text-sm tracking-wider">{params.orderNumber}</strong>
          </div>
        </div>

        {/* Detailed Receipt View if valid token provided */}
        {order ? (
          <div className="mt-10 space-y-8">
            {/* Status Pipeline */}
            <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
                Order Status: <span className="text-[#ccff00] uppercase">{order.status}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Payment Method</span>
                  <strong className="text-white">Cash on Delivery (COD)</strong>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Estimated Delivery</span>
                  <strong className="text-white">
                    {order.division === "Dhaka" ? "24 - 48 Hours" : "48 - 72 Hours"}
                  </strong>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Total Payable at Door</span>
                  <strong className="text-[#ccff00] text-sm">{formatBDT(order.total_amount)}</strong>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="p-6 bg-[#111113] border border-zinc-800 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
                Delivery Recipient
              </h2>
              <div className="text-xs text-zinc-300 font-mono space-y-1">
                <p><span className="text-zinc-500">Name:</span> {order.customer_name}</p>
                <p><span className="text-zinc-500">Phone:</span> {order.customer_phone}</p>
                {order.customer_email && (
                  <p><span className="text-zinc-500">Email:</span> {order.customer_email}</p>
                )}
                <p><span className="text-zinc-500">Location:</span> {order.district}, {order.division}</p>
                <p><span className="text-zinc-500">Address:</span> {order.delivery_address}</p>
                {order.order_notes && (
                  <p><span className="text-zinc-500">Notes:</span> {order.order_notes}</p>
                )}
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
                Purchased Apparel
              </h2>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-zinc-800/60 text-xs"
                  >
                    <div>
                      <h4 className="font-semibold uppercase text-white">{item.product_name}</h4>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-zinc-200">
                      {formatBDT(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price summary */}
              <div className="pt-2 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatBDT(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Courier Delivery Fee ({order.division})</span>
                  <span className="text-white">{formatBDT(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-800">
                  <span>Payable Upon Delivery</span>
                  <span className="text-[#ccff00] text-base">{formatBDT(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Minimal Protected View if token is omitted */
          <div className="mt-10 p-6 bg-[#111113] border border-zinc-800 text-center space-y-4">
            <ShieldCheck className="w-8 h-8 text-[#ccff00] mx-auto" />
            <h3 className="text-sm font-mono uppercase font-bold text-white">
              Private Order Summary Protected
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Order {params.orderNumber} is registered. To view detailed customer addresses and item manifests, please open the private link provided upon checkout completion.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium uppercase text-xs tracking-wider flex items-center justify-center transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
