"use client";

import { useState } from "react";
import Link from "next/link";
import { Order } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { ReturnRequestModal } from "@/components/account/return-request-modal";
import {
  Package,
  Truck,
  CheckCircle,
  ExternalLink,
  RotateCcw,
  Clock,
  MapPin,
  ArrowLeft,
} from "lucide-react";

interface Props {
  order: Order;
}

export function OrderDetailClient({ order }: Props) {
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  // Shipment Lifecycle Steps
  const steps = [
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 0;
      case "processing":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="text-xs uppercase font-bold text-zinc-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        {/* Return / Exchange eligibility */}
        {!isCancelled && (
          <button
            onClick={() => setReturnModalOpen(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-zinc-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>Request Return / Exchange</span>
          </button>
        )}
      </div>

      {/* Progress Card */}
      <div className="bg-[#121214] border border-zinc-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#ccff00] font-mono">
              {"// ORDER SUMMARY"}
            </span>
            <h1 className="text-2xl font-black font-mono text-white mt-1">
              {order.order_number}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs px-3 py-1 uppercase font-bold ${
                order.payment_status === "paid"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              Payment: {order.payment_status}
            </span>
            <span className="text-xs px-3 py-1 uppercase font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              Fulfillment: {order.status}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {!isCancelled ? (
          <div className="py-4">
            <div className="grid grid-cols-4 relative">
              {steps.map((s, idx) => {
                const isPassed = idx <= currentStep;
                return (
                  <div key={s.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 z-10 transition-colors ${
                        isPassed
                          ? "bg-[#ccff00] text-black ring-4 ring-[#ccff00]/20"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs uppercase tracking-wider font-bold ${
                        isPassed ? "text-white" : "text-zinc-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
              {/* Connecting Line */}
              <div className="absolute top-4 left-1/8 right-1/8 h-0.5 bg-zinc-800 -z-0" />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            This order has been cancelled.
          </div>
        )}
      </div>

      {/* Courier & Tracking Details */}
      {order.courier_consignment_id && (
        <div className="bg-[#121214] border border-zinc-800 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#ccff00]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Courier Delivery Information
              </h2>
            </div>
            {order.courier_tracking_url && (
              <a
                href={order.courier_tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#b8e600]"
              >
                <span>Live Courier Tracking</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div>
              <span className="text-zinc-500 block uppercase mb-1">Courier Partner</span>
              <strong className="text-white text-sm">{order.courier_name || "Pathao Courier"}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase mb-1">Consignment ID</span>
              <strong className="text-[#ccff00] font-mono text-sm">{order.courier_consignment_id}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase mb-1">Shipment Status</span>
              <strong className="text-white uppercase text-sm">
                {(order.shipment_status || "accepted_by_courier").replace(/_/g, " ")}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Items & Financial Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 bg-[#121214] border border-zinc-800 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-2 border-b border-zinc-800">
            Items Ordered ({order.items?.length || 0})
          </h2>

          <div className="divide-y divide-zinc-800">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h3 className="font-bold text-white text-sm">{item.product_name}</h3>
                  <p className="text-zinc-400 mt-0.5">
                    Size: <span className="text-white font-medium">{item.size}</span> &bull; Color:{" "}
                    <span className="text-white font-medium">{item.color}</span> &bull; SKU:{" "}
                    <span className="font-mono">{item.sku}</span>
                  </p>
                  <p className="text-zinc-500 mt-1">
                    {item.quantity} x {formatBDT(item.unit_price)}
                  </p>
                </div>
                <div className="font-mono text-sm font-bold text-[#ccff00]">
                  {formatBDT(item.line_total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial & Delivery Address */}
        <div className="space-y-6">
          <div className="bg-[#121214] border border-zinc-800 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-2 border-b border-zinc-800">
              Payment Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="text-white">{formatBDT(order.subtotal)}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({order.coupon_code || "COUPON"})</span>
                  <span>-{formatBDT(order.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-400">
                <span>Delivery Fee ({order.division})</span>
                <span className="text-white">{formatBDT(order.delivery_fee)}</span>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Total Amount</span>
                <span className="text-[#ccff00] font-mono text-base">{formatBDT(order.total_amount)}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400">
                <span>Payment Method: </span>
                <strong className="text-white uppercase">
                  {order.payment_method === "sslcommerz" ? "Online (SSLCOMMERZ)" : "Cash On Delivery"}
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-[#121214] border border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
              <MapPin className="w-4 h-4 text-[#ccff00]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Delivery Address</h2>
            </div>
            <div className="text-xs text-zinc-300 space-y-1">
              <p className="font-bold text-white">{order.customer_name}</p>
              <p>{order.delivery_address}</p>
              <p>{order.district}, {order.division}</p>
              <p className="font-mono text-zinc-400 pt-1">Phone: {order.customer_phone}</p>
            </div>
          </div>
        </div>
      </div>

      <ReturnRequestModal
        order={order}
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
      />
    </div>
  );
}
