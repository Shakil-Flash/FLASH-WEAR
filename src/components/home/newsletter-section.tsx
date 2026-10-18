"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("You are subscribed to FLASHWEAR drop alerts.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Connection error. Please try again later.");
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-[#E7E3DC]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
          Community
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181818]">
          Stay in the loop.
        </h2>
        <p className="text-sm text-[#74716D] max-w-md mx-auto leading-relaxed">
          Be the first to know about new drops, seasonal sales, and subscriber-only discounts. No spam, ever.
        </p>

        <form onSubmit={handleSubmit} className="pt-2 max-w-md mx-auto flex flex-col sm:flex-row gap-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={status === "loading" || status === "success"}
            className="flex-1 bg-[#F7F5F0] border border-[#E7E3DC] rounded-md px-4 py-2.5 text-sm text-[#181818] placeholder-[#74716D] focus:outline-none focus:border-[#181818] focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="px-5 py-2.5 bg-[#181818] hover:bg-[#FF5938] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {status === "success" && (
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-medium text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </section>
  );
}
