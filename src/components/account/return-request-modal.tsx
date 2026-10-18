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

      setSuccessMsg("Your request has been logged successfully! Our team will inspect and review your request.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141417] border border-zinc-800 w-full max-w-lg p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-[#ccff00] font-mono mb-1">
            {"// RETURN / EXCHANGE"}
          </p>
          <h2 className="text-xl font-bold uppercase text-white">
            Request for {order.order_number}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Per FLASHWEAR return policy, items must be unworn with original tags attached.
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Action Type Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Request Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestType("return")}
                className={`py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  requestType === "return"
                    ? "bg-[#ccff00] text-black border-[#ccff00]"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                Return for Refund
              </button>
              <button
                type="button"
                onClick={() => setRequestType("exchange")}
                className={`py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  requestType === "exchange"
                    ? "bg-[#ccff00] text-black border-[#ccff00]"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                Size / Color Exchange
              </button>
            </div>
          </div>

          {/* Select Items */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Select Items
            </label>
            <div className="space-y-2 border border-zinc-800 p-3 bg-[#18181b]">
              {order.items?.map((item) => {
                const isSelected = Boolean(selectedItems[item.id]);
                return (
                  <div
                    key={item.id}
                    className={`p-3 border transition-colors ${
                      isSelected ? "border-[#ccff00] bg-zinc-900" : "border-zinc-800"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item)}
                        className="accent-[#ccff00] w-4 h-4"
                      />
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-white">{item.product_name}</div>
                        <div className="text-zinc-400">
                          Size: {item.size} &bull; Qty: {item.quantity} &bull; {formatBDT(item.unit_price)}
                        </div>
                      </div>
                    </label>

                    {isSelected && requestType === "exchange" && (
                      <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center gap-2 text-xs">
                        <span className="text-zinc-400">Target Exchange Size:</span>
                        <select
                          value={selectedItems[item.id]?.exchangeSize || "L"}
                          onChange={(e) => handleExchangeSizeChange(item.id, e.target.value)}
                          className="bg-zinc-800 border border-zinc-700 text-white px-2 py-1 text-xs"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Reason for Request
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Customer Comments
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Additional details regarding your return or exchange..."
              className="w-full bg-[#18181b] border border-zinc-700 p-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-700 text-xs font-bold uppercase text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#b8e600] disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
