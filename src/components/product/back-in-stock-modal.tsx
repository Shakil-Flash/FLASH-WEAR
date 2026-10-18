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
          setSuccess(false);
          setEmail("");
          onClose();
        }, 2500);
      } else {
        setErrorMessage(data.error || "Failed to subscribe. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141417] border border-zinc-800 w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#ccff00] mb-2">
          {type === "back_in_stock" ? <Bell className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{type === "back_in_stock" ? "Restock Notification" : "Price Drop Alert"}</span>
        </div>

        <h3 className="text-lg font-bold uppercase tracking-tight text-white">{productName}</h3>
        {variantLabel && (
          <p className="text-xs text-zinc-400 mt-0.5">
            Selected Variant: <span className="text-[#ccff00] font-mono">{variantLabel}</span>
          </p>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Alert Configured!</h4>
            <p className="text-xs text-zinc-400">
              We will notify you at <strong className="text-zinc-200">{email}</strong> as soon as this item is ready.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Your Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            {type === "price_drop" && (
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Target Price (BDT)
                </label>
                <input
                  type="number"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#ccff00]"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Current price: ৳{currentPrice?.toLocaleString()}
                </span>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 leading-normal">
              By subscribing, you agree to receive a single automated alert for this product. You can unsubscribe at any time.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving Alert..." : type === "back_in_stock" ? "Notify Me When Available" : "Set Price Alert"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
