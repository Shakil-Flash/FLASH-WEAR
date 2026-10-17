import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions of service for purchasing apparel on FLASHWEAR.",
};

export default function TermsPage() {
  return (
    <div className="bg-[#0a0a0b] min-h-screen py-16 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-zinc-800 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccff00]">
            Store Agreement
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-2">
            Terms & Conditions
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          <h2 className="text-sm font-bold font-mono uppercase text-white">1. Orders and Acceptance</h2>
          <p>
            By submitting an order on FLASHWEAR via Cash on Delivery, you confirm that you are purchasing for personal use and that all supplied recipient details (phone, full address) are authentic and reachable by courier riders.
          </p>

          <h2 className="text-sm font-bold font-mono uppercase text-white">2. Inventory and Pricing</h2>
          <p>
            All prices are stated in Bangladeshi Taka (BDT) and include applicable local value charges. While we take every effort to maintain accurate real-time inventory, in the event an item experiences concurrent stock depletion, our team will promptly contact you to offer an exchange or immediate order cancellation.
          </p>

          <h2 className="text-sm font-bold font-mono uppercase text-white">3. Intellectual Property</h2>
          <p>
            All graphics, logos, typography, visual layouts, and garment designs displayed on this website are the exclusive property of FLASHWEAR Ltd. and protected under applicable trademark and copyright laws.
          </p>
        </div>
      </div>
    </div>
  );
}
