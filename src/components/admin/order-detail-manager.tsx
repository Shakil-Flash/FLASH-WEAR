"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  CreditCard,
  Tag,
} from "lucide-react";

interface OrderDetailManagerProps {
  order: Order;
}

export function OrderDetailManager({ order: initialOrder }: OrderDetailManagerProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || "");
  const [selectedCourier, setSelectedCourier] = useState(order.courier_name || "Pathao Courier");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status,
          trackingNumber,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }

      setMessage({ text: "Order details successfully saved.", type: "success" });
      setOrder((prev) => ({
        ...prev,
        status,
        tracking_number: trackingNumber,
        admin_notes: adminNotes,
      }));
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBookShipment = async () => {
    setIsShipping(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierName: selectedCourier }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Shipment booking failed");
      }

      const shipment = data.shipment;
      setMessage({
        text: `Shipment booked with ${shipment.courierName}. Consignment: ${shipment.consignmentId}`,
        type: "success",
      });

      setOrder((prev) => ({
        ...prev,
        courier_name: shipment.courierName,
        courier_consignment_id: shipment.consignmentId,
        courier_tracking_url: shipment.trackingUrl,
        shipment_status: shipment.status,
        tracking_number: shipment.consignmentId,
        status: "shipped",
      }));
      setStatus("shipped");
      setTrackingNumber(shipment.consignmentId);
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsShipping(false);
    }
  };

  const handleCancelOrder = async () => {
    if (
      !confirm(
        `Are you sure you want to cancel order ${order.order_number}? This will restore the purchased variant quantities back into available warehouse inventory.`
      )
    ) {
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          action: "cancel",
          adminNotes: `Cancelled by admin on ${new Date().toLocaleString()}. Restored variant inventory.`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cancellation failed");
      }

      setMessage({ text: "Order cancelled and variant inventory restored.", type: "success" });
      setStatus("cancelled");
      setOrder((prev) => ({ ...prev, status: "cancelled", payment_status: "cancelled" }));
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`p-4 border text-xs font-mono flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Payment & Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#111113] border border-zinc-800 p-4 text-xs font-mono">
        <div>
          <span className="text-zinc-500 block">Payment Method</span>
          <strong className="text-white uppercase">{order.payment_method === "sslcommerz" ? "Online (SSLCOMMERZ)" : "Cash On Delivery"}</strong>
        </div>
        <div>
          <span className="text-zinc-500 block">Payment Status</span>
          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase ${
            order.payment_status === "paid"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
          }`}>
            {order.payment_status}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Fulfillment Status</span>
          <span className="text-white font-bold uppercase">{order.status}</span>
        </div>
        <div>
          <span className="text-zinc-500 block">Shipment Status</span>
          <span className="text-[#ccff00] font-bold uppercase">{(order.shipment_status || "not_shipped").replace(/_/g, " ")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Items & Customer Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Purchased Items Table */}
          <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white border-b border-zinc-800 pb-2">
              Purchased Variants ({order.items?.length || 0})
            </h3>

            <div className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {item.product_image_url && (
                      <div className="w-12 h-14 bg-zinc-950 overflow-hidden flex-shrink-0">
                        <img
                          src={item.product_image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold uppercase text-white">{item.product_name}</h4>
                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        SKU: <strong className="text-zinc-200">{item.sku}</strong> • Size: {item.size} • Color: {item.color}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-500">
                        Unit: {formatBDT(item.unit_price)} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-sm text-[#ccff00]">
                    {formatBDT(item.line_total)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="text-white">{formatBDT(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discount ({order.coupon_code || "COUPON"})</span>
                  <span>-{formatBDT(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Delivery Fee ({order.division})</span>
                <span className="text-white">{formatBDT(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-800">
                <span>Total Amount</span>
                <span className="text-[#ccff00] text-base">{formatBDT(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white border-b border-zinc-800 pb-2">
              Customer & Shipping Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block">Customer Name</span>
                <strong className="text-white text-sm">{order.customer_name}</strong>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block">Phone (Courier Contact)</span>
                <strong className="text-white text-sm">{order.customer_phone}</strong>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block">Division & District</span>
                <strong className="text-white">{order.district}, {order.division}</strong>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block">Email Address</span>
                <strong className="text-white">{order.customer_email || "Not provided"}</strong>
              </div>
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 block mb-1">Full Street Delivery Address</span>
              <p className="text-white leading-relaxed">{order.delivery_address}</p>
            </div>

            {order.order_notes && (
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
                <span className="text-zinc-500 block mb-1">Customer Delivery Notes</span>
                <p className="text-zinc-300 italic">{order.order_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Actions & Status Manager */}
        <div className="lg:col-span-4 space-y-6">
          {/* Automated Courier Dispatch Box */}
          <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#ccff00]" />
              <span>Courier Dispatch Layer</span>
            </h3>

            {order.courier_consignment_id ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block">Active Carrier</span>
                  <strong className="text-white">{order.courier_name}</strong>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block">Consignment ID</span>
                  <strong className="text-[#ccff00] text-sm">{order.courier_consignment_id}</strong>
                </div>
                {order.courier_tracking_url && (
                  <a
                    href={order.courier_tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open Live Courier Tracking</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs uppercase font-mono text-zinc-400">
                  Select Courier Partner
                </label>
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white"
                >
                  <option value="Pathao Courier">Pathao Courier (Official API)</option>
                  <option value="Steadfast Courier">Steadfast Courier</option>
                  <option value="RedX Logistics">RedX Logistics</option>
                  <option value="Sundarban Courier">Sundarban Courier</option>
                </select>

                <button
                  type="button"
                  onClick={handleBookShipment}
                  disabled={isShipping || order.status === "cancelled"}
                  className="w-full py-2.5 bg-[#ccff00] hover:bg-[#b8e600] disabled:opacity-40 text-black font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  <span>{isShipping ? "Dispatching..." : `Book with ${selectedCourier}`}</span>
                </button>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Automatically generates tracking code and prevents duplicate bookings.
                </p>
              </div>
            )}
          </div>

          <div className="p-6 bg-[#111113] border border-zinc-800 space-y-5">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white border-b border-zinc-800 pb-2">
              Status &amp; Notes
            </h3>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-zinc-400">
                Order Status
              </label>
              <select
                value={status}
                disabled={order.status === "cancelled"}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              >
                <option value="pending">Pending (Awaiting Confirmation)</option>
                <option value="confirmed">Confirmed (Verified with Customer)</option>
                <option value="processing">Processing (Packing in Studio)</option>
                <option value="shipped">Shipped (Handed to Courier)</option>
                <option value="delivered">Delivered (Cash Collected)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Courier Tracking Number */}
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-zinc-400">
                Manual Tracking / Consignment #
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., ST-DH-849302"
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            {/* Admin Internal Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-zinc-400">
                Internal Staff Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified via call with customer at 4:30 PM..."
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full py-3 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-zinc-800 text-black font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdating ? "Saving..." : "Save Order Updates"}</span>
            </button>

            {/* Cancel & Restore Stock Action */}
            {order.status !== "cancelled" && (
              <div className="pt-4 border-t border-zinc-800">
                <button
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel Order & Restore Stock</span>
                </button>
                <p className="text-[10px] font-mono text-zinc-500 mt-2 text-center">
                  Safely cancels this order and restores all variant quantities back to inventory.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
