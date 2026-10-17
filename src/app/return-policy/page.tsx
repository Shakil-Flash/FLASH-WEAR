import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Return & Exchange Policy",
  description: "FLASHWEAR 7-day size exchange and damaged item policy in Bangladesh.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-[#0a0a0b] min-h-screen py-16 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-zinc-800 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccff00]">
            Customer Satisfaction
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-2">
            Return & Exchange Policy
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">1. 7-Day Size Exchange Window</h2>
            <p>
              We want your streetwear fit to be exact. If you selected a size that does not drape the way you prefer, you may request a size exchange within <strong>7 calendar days</strong> from the date of parcel receipt.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">2. Eligibility Conditions</h2>
            <p>To qualify for an exchange, items must:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-300">
              <li>Be unworn, unwashed, and without perfume, deodorant, or smoke odors.</li>
              <li>Have all original FLASHWEAR tags and woven labels intact.</li>
              <li>Be returned in original packaging.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">3. Exchange Procedure</h2>
            <p>
              Contact our WhatsApp support team at <strong>+880 1700-000000</strong> with your Order Number and preferred replacement size. Our courier will deliver the replacement size and pick up the original item simultaneously.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">4. Defective or Incorrect Items</h2>
            <p>
              In the rare event you receive a manufacturing defect or wrong style, FLASHWEAR covers 100% of the replacement courier costs. Please inform us within 48 hours of delivery with photos of the issue.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
