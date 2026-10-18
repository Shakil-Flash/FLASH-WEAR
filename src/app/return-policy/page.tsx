import React from "react";

export const metadata = {
  title: "Return & Exchange Policy | FLASHWEAR",
  description: "FLASHWEAR 7-day size exchange and damaged item policy in Bangladesh.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-[#F7F5F0] min-h-screen py-16 sm:py-20 text-[#181818]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-[#E7E3DC] pb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#FF5938]">
            Customer Satisfaction
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#181818] mt-2">
            Return &amp; Exchange Policy
          </h1>
          <p className="text-xs text-[#74716D] mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#181818] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">1. 7-Day Size Exchange Window</h2>
            <p className="text-[#74716D]">
              We want your fit to be exact. If you selected a size that does not drape the way you prefer, you may request a size exchange within <strong className="text-[#181818]">7 calendar days</strong> from the date of parcel delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">2. Eligibility Conditions</h2>
            <p className="text-[#74716D]">To qualify for an exchange, items must:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#74716D]">
              <li>Be unworn, unwashed, and free of odors or marks.</li>
              <li>Have all original FLASHWEAR tags and labels intact.</li>
              <li>Be returned in original packaging.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">3. Exchange Procedure</h2>
            <p className="text-[#74716D]">
              Contact our support team or request a return directly from your <strong className="text-[#181818]">Account &gt; My Orders</strong> portal. Our courier will deliver the replacement size and pick up the original item simultaneously.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">4. Defective or Incorrect Items</h2>
            <p className="text-[#74716D]">
              In the rare event you receive a manufacturing defect or wrong item, FLASHWEAR covers 100% of the replacement courier costs. Please inform us within 48 hours of delivery with photos of the issue.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
