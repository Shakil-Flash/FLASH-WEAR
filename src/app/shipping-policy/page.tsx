import React from "react";
import { Truck } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery Policy | FLASHWEAR",
  description: "Bangladesh-wide shipping policy, delivery timelines, and courier fee details for FLASHWEAR.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-[#F7F5F0] min-h-screen py-16 sm:py-20 text-[#181818]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-[#E7E3DC] pb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#FF5938]">
            Logistics &amp; Fulfillment
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#181818] mt-2">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-[#74716D] mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#181818] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">1. Nationwide Coverage</h2>
            <p className="text-[#74716D]">
              FLASHWEAR delivers to all 64 districts in Bangladesh via verified courier partners including Pathao and Steadfast.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">2. Delivery Fees</h2>
            <div className="p-5 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#74716D]">Inside Dhaka City:</span>
                <strong className="text-[#181818]">৳80</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74716D]">Outside Dhaka (All other districts):</span>
                <strong className="text-[#181818]">৳150</strong>
              </div>
              <div className="flex justify-between text-[#FF5938] font-bold pt-2 border-t border-[#E7E3DC]">
                <span>Orders over ৳3,000:</span>
                <span>FREE DELIVERY</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">3. Delivery Timelines</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#74716D]">
              <li><strong>Inside Dhaka:</strong> Orders are typically fulfilled and delivered within 24 to 48 hours.</li>
              <li><strong>Outside Dhaka:</strong> Deliveries arrive within 48 to 72 hours from dispatch.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">4. Cash on Delivery (COD) Inspection</h2>
            <p className="text-[#74716D]">
              Customers may inspect the exterior condition of the package prior to handing payment over to the courier rider. If the tamper-evident packaging is visibly torn or damaged, you have the right to refuse delivery immediately and contact our support.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
