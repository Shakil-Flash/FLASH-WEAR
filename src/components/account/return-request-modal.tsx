"use client";

import { useState } from "react";
import { Order, OrderItem } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

interface ReturnModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function ReturnRequestModal({ order, isOpen, onClose }: ReturnModalProps) {
  const [requestType, setRequestType] = useState<"return" | "exchange">("return");
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; exchangeSize?: string }>>({});
  const [reason, setReason] = useState("Size / Fit issue");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleItem = (item: OrderItem) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = { quantity: item.quantity, exchangeSize: item.size === "M" ? "L" : "M" };
      }
      return next;
    });
  };

  const handleExchangeSizeChange = (itemId: string, size: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], exchangeSize: size },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const itemsPayload = Object.entries(selectedItems).map(([itemId, details]) => {
      const originalItem = order.items?.find((i) => i.id === itemId);
      return {
        order_item_id: itemId,
        product_id: originalItem?.product_id || "",
        variant_id: originalItem?.variant_id || "",
        sku: originalItem?.sku || "SKU",
        product_name: originalItem?.product_name || "Item",
        size: originalItem?.size || "M",
        quantity: details.quantity,
        unit_price: originalItem?.unit_price || 0,
        exchange_size: requestType === "exchange" ? details.exchangeSize : undefined,
      };
    });

    if (itemsPayload.length === 0) {
      setErrorMsg("Please select at least one item from the order.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          userId: order.user_id || "usr-demo",
          customerName: order.customer_name,
          customerEmail: order.customer_email || "customer@flashwear.store",
          customerPhone: order.customer_phone,
          requestType,
          items: itemsPayload,
          reason,
          customerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccessMsg("Your request has been logged successfully! Our team will review your request.");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E7E3DC] rounded-xl w-full max-w-lg p-6 relative shadow-xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#74716D] hover:text-[#181818] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            Return &amp; Exchange
          </p>
          <h2 className="text-xl font-bold text-[#181818]">
            Request for {order.order_number}
          </h2>
          <p className="text-xs text-[#74716D] mt-1">
            Items must be in original condition with tags attached.
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Action Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-2">
              Request Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestType("return")}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                  requestType === "return"
                    ? "border-[#FF5938] bg-[#FFF5F3] text-[#FF5938] font-semibold"
                    : "border-[#E7E3DC] text-[#74716D] hover:border-[#181818]"
                }`}
              >
                Return for Refund
              </button>
              <button
                type="button"
                onClick={() => setRequestType("exchange")}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                  requestType === "exchange"
                    ? "border-[#FF5938] bg-[#FFF5F3] text-[#FF5938] font-semibold"
                    : "border-[#E7E3DC] text-[#74716D] hover:border-[#181818]"
                }`}
              >
                Size / Color Exchange
              </button>
            </div>
          </div>

          {/* Select Items */}
          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-2">
              Select Items
            </label>
            <div className="space-y-2 border border-[#E7E3DC] rounded-lg p-3 bg-[#F7F5F0]">
              {order.items?.map((item) => {
                const isSelected = Boolean(selectedItems[item.id]);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border bg-white transition-all ${
                      isSelected ? "border-[#FF5938] shadow-xs" : "border-[#E7E3DC]"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item)}
                        className="accent-[#FF5938] w-4 h-4"
                      />
                      <div className="flex-1 text-xs">
                        <div className="font-semibold text-[#181818]">{item.product_name}</div>
                        <div className="text-[#74716D] mt-0.5">
                          Size: {item.size} &bull; Qty: {item.quantity} &bull; {formatBDT(item.unit_price)}
                        </div>
                      </div>
                    </label>

                    {isSelected && requestType === "exchange" && (
                      <div className="mt-3 pt-2 border-t border-[#E7E3DC] flex items-center gap-2 text-xs">
                        <span className="text-[#74716D]">Target Exchange Size:</span>
                        <select
                          value={selectedItems[item.id]?.exchangeSize || "L"}
                          onChange={(e) => handleExchangeSizeChange(item.id, e.target.value)}
                          className="bg-white border border-[#E7E3DC] rounded px-2 py-1 text-xs text-[#181818]"
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-1.5">
              Reason for Request
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938]"
            >
              <option value="Size / Fit issue">Size / Fit issue (Too tight / too loose)</option>
              <option value="Defective or damaged">Defective or stitching damage</option>
              <option value="Incorrect item dispatched">Incorrect item received</option>
              <option value="Color not as expected">Color not as expected</option>
              <option value="Changed mind">Changed mind</option>
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-1.5">
              Additional Details
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Provide any relevant details about fit or condition..."
              className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg p-2.5 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E3DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E7E3DC] rounded-lg text-xs font-medium text-[#74716D] hover:text-[#181818]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shadow-xs"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
