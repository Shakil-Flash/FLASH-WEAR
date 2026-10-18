import React from "react";

export const metadata = {
  title: "Privacy Policy | FLASHWEAR",
  description: "Customer data privacy, courier delivery sharing, and security policy for FLASHWEAR.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#F7F5F0] min-h-screen py-16 sm:py-20 text-[#181818]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-[#E7E3DC] pb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#FF5938]">
            Data Integrity &amp; Safety
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#181818] mt-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#74716D] mt-2">Last Updated: October 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-[#181818] leading-relaxed">
          <p className="text-[#74716D]">
            At FLASHWEAR, we respect customer privacy. This policy explains what information we collect when you order through our store and how it is protected.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818] pt-2">1. Data We Collect</h2>
          <p className="text-[#74716D]">
            When placing an order, we collect: full name, delivery address, phone number, optional email, and courier instructions. Payment details processed via SSLCOMMERZ are handled by PCI-DSS compliant payment gateways and are never stored on our servers.
          </p>

          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818] pt-2">2. Purpose of Collection</h2>
          <p className="text-[#74716D]">
            Information collected is utilized strictly to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#74716D]">
            <li>Generate your order receipt and reserve warehouse inventory.</li>
            <li>Coordinate shipping with local courier partners.</li>
            <li>Send order confirmation notices and shipment tracking updates.</li>
          </ul>

          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818] pt-2">3. Third-Party Sharing</h2>
          <p className="text-[#74716D]">
            We only share delivery details (name, phone, address) with our contracted courier delivery partners. We never sell, rent, or trade your personal information.
          </p>
        </div>
      </div>
    </div>
  );
}
