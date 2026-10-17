import React from "react";

export const metadata = {
  title: "Privacy Policy",
  description: "FLASHWEAR Customer data privacy, courier delivery sharing, and security policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#0a0a0b] min-h-screen py-16 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-zinc-800 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccff00]">
            Data Integrity & Safety
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-2">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          <p>
            At FLASHWEAR, we respect customer privacy. This Privacy Policy details what information we collect when you order through our online store and how it is protected.
          </p>

          <h2 className="text-sm font-bold font-mono uppercase text-white pt-2">1. Data We Collect</h2>
          <p>
            When placing a Cash on Delivery order, we collect: full name, shipping address, Bangladesh phone number, optional email, and order notes. We do not store or process debit/credit card numbers or banking passwords in Phase 1.
          </p>

          <h2 className="text-sm font-bold font-mono uppercase text-white pt-2">2. Purpose of Collection</h2>
          <p>
            Information collected is utilized strictly to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400">
            <li>Generate your order invoice and inventory reservations.</li>
            <li>Coordinate shipping with local courier dispatchers.</li>
            <li>Send order confirmation notices and shipment tracking updates.</li>
          </ul>

          <h2 className="text-sm font-bold font-mono uppercase text-white pt-2">3. Third-Party Sharing</h2>
          <p>
            We only share delivery details (name, phone, address) with our contracted courier delivery partners. We never sell, rent, or trade your personal data to advertising broker networks.
          </p>
        </div>
      </div>
    </div>
  );
}
