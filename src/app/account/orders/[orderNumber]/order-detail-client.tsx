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
          className="text-xs font-semibold text-[#74716D] hover:text-[#181818] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        {/* Return / Exchange eligibility */}
        {!isCancelled && (
          <button
            onClick={() => setReturnModalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-[#F7F5F0] text-[#181818] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-[#E7E3DC] shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FF5938]" />
            <span>Request Return / Exchange</span>
          </button>
        )}
      </div>

      {/* Progress Card */}
      <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E7E3DC]">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#FF5938]">
              Order Summary
            </span>
            <h1 className="text-2xl font-bold text-[#181818] mt-1">
              {order.order_number}
            </h1>
            <p className="text-xs text-[#74716D] mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs px-3 py-1 font-medium rounded-full ${
                order.payment_status === "paid"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              Payment: {order.payment_status}
            </span>
            <span className="text-xs px-3 py-1 font-medium rounded-full bg-[#F7F5F0] text-[#181818] border border-[#E7E3DC]">
              Status: {order.status}
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
                          ? "bg-[#FF5938] text-white ring-4 ring-[#FF5938]/15"
                          : "bg-[#F7F5F0] border border-[#E7E3DC] text-[#74716D]"
                      }`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs uppercase tracking-wider font-semibold ${
                        isPassed ? "text-[#181818]" : "text-[#74716D]"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
              {/* Connecting Line */}
              <div className="absolute top-4 left-1/8 right-1/8 h-0.5 bg-[#E7E3DC] -z-0" />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            This order has been cancelled.
          </div>
        )}
      </div>

      {/* Courier & Tracking Details */}
      {order.courier_consignment_id && (
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DC]">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#FF5938]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">
                Courier Delivery Information
              </h2>
            </div>
            {order.courier_tracking_url && (
              <a
                href={order.courier_tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-[#FF5938] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-[#E64525] transition-colors"
              >
                <span>Live Courier Tracking</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div>
              <span className="text-[#74716D] block uppercase mb-1">Courier Partner</span>
              <strong className="text-[#181818] text-sm">{order.courier_name || "Pathao Courier"}</strong>
            </div>
            <div>
              <span className="text-[#74716D] block uppercase mb-1">Consignment ID</span>
              <strong className="text-[#FF5938] text-sm">{order.courier_consignment_id}</strong>
            </div>
            <div>
              <span className="text-[#74716D] block uppercase mb-1">Shipment Status</span>
              <strong className="text-[#181818] capitalize text-sm">
                {(order.shipment_status || "accepted_by_courier").replace(/_/g, " ")}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Items & Financial Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818] mb-4 pb-2 border-b border-[#E7E3DC]">
            Items Ordered ({order.items?.length || 0})
          </h2>

          <div className="divide-y divide-[#E7E3DC]">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <h3 className="font-semibold text-[#181818] text-sm">{item.product_name}</h3>
                  <p className="text-[#74716D] mt-0.5">
                    Size: <span className="text-[#181818] font-medium">{item.size}</span> &bull; Color:{" "}
                    <span className="text-[#181818] font-medium">{item.color}</span> &bull; SKU:{" "}
                    <span>{item.sku}</span>
                  </p>
                  <p className="text-[#74716D] mt-1">
                    {item.quantity} x {formatBDT(item.unit_price)}
                  </p>
                </div>
                <div className="text-sm font-bold text-[#181818]">
                  {formatBDT(item.line_total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial & Delivery Address */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818] mb-4 pb-2 border-b border-[#E7E3DC]">
              Payment Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#74716D]">
                <span>Subtotal</span>
                <span className="text-[#181818] font-medium">{formatBDT(order.subtotal)}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({order.coupon_code || "COUPON"})</span>
                  <span>-{formatBDT(order.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#74716D]">
                <span>Delivery Fee ({order.division})</span>
                <span className="text-[#181818] font-medium">{formatBDT(order.delivery_fee)}</span>
              </div>

              <div className="pt-3 border-t border-[#E7E3DC] flex justify-between items-center text-sm font-bold">
                <span className="text-[#181818]">Total Amount</span>
                <span className="text-[#FF5938] text-base">{formatBDT(order.total_amount)}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E7E3DC] text-[11px] text-[#74716D]">
                <span>Payment Method: </span>
                <strong className="text-[#181818] uppercase">
                  {order.payment_method === "sslcommerz" ? "Online (SSLCOMMERZ)" : "Cash On Delivery"}
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E7E3DC]">
              <MapPin className="w-4 h-4 text-[#FF5938]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Delivery Address</h2>
            </div>
            <div className="text-xs text-[#181818] space-y-1 leading-relaxed">
              <p className="font-semibold">{order.customer_name}</p>
              <p>{order.delivery_address}</p>
              <p>{order.district}, {order.division}</p>
              <p className="text-[#74716D] pt-1">Phone: {order.customer_phone}</p>
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
