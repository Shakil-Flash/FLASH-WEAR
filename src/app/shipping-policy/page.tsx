import React from "react";
import Link from "next/link";
import { Truck, Clock, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery Policy",
  description: "Bangladesh-wide shipping policy, delivery timelines, and courier fee details for FLASHWEAR.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-[#0a0a0b] min-h-screen py-16 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-zinc-800 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccff00]">
            Logistics & Fulfilment
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-2">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">1. Nationwide Coverage</h2>
            <p>
              FLASHWEAR delivers to all 64 districts in Bangladesh via accredited express courier partners (e.g., Steadfast, Pathao, Paperfly).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">2. Delivery Fees</h2>
            <div className="p-4 bg-[#111113] border border-zinc-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span>Inside Dhaka City:</span>
                <strong className="text-white">৳80</strong>
              </div>
              <div className="flex justify-between">
                <span>Outside Dhaka (All other districts):</span>
                <strong className="text-white">৳150</strong>
              </div>
              <div className="flex justify-between text-[#ccff00]">
                <span>Orders over ৳3,000:</span>
                <strong>FREE DELIVERY</strong>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              * Delivery fees are standard flat rates set by FLASHWEAR and are subject to promotional updates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">3. Delivery Timelines</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-300">
              <li><strong>Inside Dhaka:</strong> Orders are typically fulfilled and delivered within 24 to 48 hours.</li>
              <li><strong>Outside Dhaka:</strong> Deliveries arrive within 48 to 72 hours from dispatch.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-mono uppercase text-white">4. Cash on Delivery (COD) Inspection</h2>
            <p>
              Customers may inspect the exterior condition of the package prior to handing the cash over to the courier rider. If the tamper-evident packaging is visibly torn or damaged, you have the right to refuse delivery immediately and contact our support.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
