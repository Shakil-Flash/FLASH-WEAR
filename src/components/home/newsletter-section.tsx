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
        setMessage("You are registered for Drop 02 VIP early access.");
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
    <section className="py-20 bg-[#0d0d0f] border-b border-zinc-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
          VIP Broadcast
        </span>
        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mt-2 mb-3">
          Get Drop Alerts 30 Minutes Before Public Release
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mb-8">
          Limited quantity capsules sell out fast. Subscribe with your email to receive private drop links and secret release codes.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address..."
            disabled={status === "loading" || status === "success"}
            className="flex-1 bg-black border border-zinc-800 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="px-6 py-3 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Registering..." : "Join List"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {status === "success" && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-[#ccff00]">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <p className="text-[10px] font-mono text-zinc-600 mt-4">
          Strict no-spam policy. Unsubscribe anytime with 1 click.
        </p>
      </div>
    </section>
  );
}
