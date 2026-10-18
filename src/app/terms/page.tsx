import React from "react";

export const metadata = {
  title: "Terms and Conditions | FLASHWEAR",
  description: "Terms and conditions of service for purchasing apparel on FLASHWEAR.",
};

export default function TermsPage() {
  return (
    <div className="bg-[#F7F5F0] min-h-screen py-16 sm:py-20 text-[#181818]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-[#E7E3DC] pb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#FF5938]">
            Store Agreement
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#181818] mt-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-[#74716D] mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-[#181818] leading-relaxed">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">1. Orders and Acceptance</h2>
          <p className="text-[#74716D]">
            By placing an order on FLASHWEAR via Cash on Delivery or online payment, you confirm that you are purchasing for personal use and that all supplied recipient details (phone, full address) are authentic and reachable by courier riders.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">2. Inventory and Pricing</h2>
          <p className="text-[#74716D]">
            All prices are stated in Bangladeshi Taka (BDT) and include applicable taxes. While we maintain accurate real-time inventory, in the rare event an item experiences concurrent stock depletion, our team will promptly contact you to arrange an alternative or immediate cancellation.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">3. Intellectual Property</h2>
          <p className="text-[#74716D]">
            All graphics, logos, typography, visual layouts, and apparel designs displayed on this website are the property of FLASHWEAR and protected under applicable copyright and trademark laws.
          </p>
        </div>
      </div>
    </div>
  );
}
