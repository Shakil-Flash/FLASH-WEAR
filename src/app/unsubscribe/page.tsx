"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "general";
  const [resubscribed, setResubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getTitleAndMessage = () => {
    switch (status) {
      case "cart_unsubscribed":
        return {
          title: "Unsubscribed from Cart Reminders",
          message: "You will no longer receive reminder emails regarding incomplete shopping carts.",
        };
      case "subscription_cancelled":
        return {
          title: "Notification Cancelled",
          message: "You will no longer receive restock or price drop alerts for this item.",
        };
      case "newsletter_unsubscribed":
      default:
        return {
          title: "You Have Been Unsubscribed",
          message: "You have been successfully removed from our promotional mailing list.",
        };
    }
  };

  const { title, message } = getTitleAndMessage();

  const handleResubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, source: "resubscribe_page" }),
      });
      if (res.ok) {
        setResubscribed(true);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="bg-[#121214] border border-zinc-800 p-8 sm:p-12 text-center max-w-lg w-full">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-black uppercase tracking-tight text-white">{title}</h1>
      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{message}</p>

      {/* Accidental Unsubscribe Recovery */}
      {!resubscribed ? (
        <div className="mt-8 pt-8 border-t border-zinc-800/80">
          <p className="text-xs text-zinc-400 mb-3">Unsubscribed by accident? Re-enter your email to stay in the loop with streetwear drops:</p>
          <form onSubmit={handleResubscribe} className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {submitting ? "..." : "Re-join"}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          ✓ Welcome back! You are re-subscribed.
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <span>Return to Store</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-24">
      <Suspense fallback={<div className="text-zinc-500 text-xs font-mono">Loading...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
