"use client";

import { useState } from "react";
import { Bell, X, CheckCircle2, TrendingDown } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variantId?: string | null;
  variantLabel?: string;
  type: "back_in_stock" | "price_drop";
  currentPrice?: number;
}

export function BackInStockModal({
  isOpen,
  onClose,
  productId,
  productName,
  variantId,
  variantLabel,
  type,
  currentPrice,
}: Props) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState<number | undefined>(
    currentPrice ? Math.round(currentPrice * 0.9) : undefined
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          productId,
          variantId: variantId || null,
          subscriptionType: type,
          targetPrice: type === "price_drop" ? targetPrice : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setEmail("");
        }, 2200);
      } else {
        setErrorMessage(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#181818]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E7E3DC] rounded-lg w-full max-w-md p-6 relative shadow-xl text-[#181818]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#74716D] hover:text-[#181818] rounded-md transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-2">
          {type === "back_in_stock" ? <Bell className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-[#FF5938]" />}
          <span>{type === "back_in_stock" ? "Restock Notification" : "Price Drop Alert"}</span>
        </div>

        <h3 className="font-display text-lg font-bold tracking-tight text-[#181818]">{productName}</h3>
        {variantLabel && (
          <p className="text-xs text-[#74716D] mt-0.5">
            Selected Option: <span className="text-[#181818] font-semibold">{variantLabel}</span>
          </p>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-[#181818]">Alert Configured!</h4>
            <p className="text-xs text-[#74716D]">
              We will notify you at <strong className="text-[#181818]">{email}</strong> as soon as this item is ready.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#181818] mb-1.5">
                Your Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-md px-3.5 py-2.5 text-xs text-[#181818] placeholder-[#74716D] focus:outline-none focus:border-[#181818] focus:bg-white transition-colors"
              />
            </div>

            {type === "price_drop" && (
              <div>
                <label className="block text-xs font-medium text-[#181818] mb-1.5">
                  Target Price (BDT)
                </label>
                <input
                  type="number"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-md px-3.5 py-2.5 text-xs text-[#181818] focus:outline-none focus:border-[#181818] focus:bg-white transition-colors"
                />
                <span className="text-[11px] text-[#74716D] mt-1 block">
                  Current price: ৳{currentPrice?.toLocaleString()}
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#74716D] leading-relaxed">
              We will only email you regarding this product alert. Unsubscribe at any time with one click.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white font-semibold text-xs uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving Alert..." : type === "back_in_stock" ? "Notify Me When Available" : "Set Price Alert"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
