import React from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Contact & Studio Support | FLASHWEAR",
  description: "Get in touch with the FLASHWEAR customer team in Dhaka, Bangladesh.",
};

export default function ContactPage() {
  return (
    <div className="bg-[#F7F5F0] min-h-screen py-16 sm:py-20 text-[#181818]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="border-b border-[#E7E3DC] pb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#FF5938]">
            Customer Support
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#181818] mt-2">
            Contact &amp; Assistance
          </h1>
          <p className="text-xs sm:text-sm text-[#74716D] mt-2">
            Have questions regarding sizing, delivery dispatch, or order status? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818] border-b border-[#E7E3DC] pb-2">
                Customer Care Desk
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#FF5938] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#74716D] block">Phone &amp; WhatsApp:</span>
                    <strong className="text-[#181818]">+880 1700-000000</strong>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#FF5938] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#74716D] block">Email Inquiries:</span>
                    <strong className="text-[#181818]">support@flashwear.store</strong>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#FF5938] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#74716D] block">Studio Address:</span>
                    <strong className="text-[#181818]">Road 11, Block C, Banani, Dhaka 1213</strong>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#FF5938] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[#74716D] block">Support Hours:</span>
                    <strong className="text-[#181818]">10:00 AM – 10:00 PM (Saturday – Thursday)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Support Note */}
          <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818] border-b border-[#E7E3DC] pb-2">
                Order Tracking &amp; Assistance
              </h3>
              <p className="text-xs text-[#74716D] leading-relaxed">
                For the fastest assistance with an existing order, please provide your <strong className="text-[#181818]">Order Number</strong> (found in your confirmation email or Account dashboard).
              </p>
              <p className="text-xs text-[#74716D] leading-relaxed">
                Exchange requests are accepted within 7 days of delivery for unworn garments with all tags and original packaging intact.
              </p>
            </div>
            <div className="pt-6 border-t border-[#E7E3DC]">
              <span className="inline-block text-xs font-semibold text-[#181818] bg-[#F2EFEB] border border-[#E7E3DC] px-3 py-1.5 rounded-lg">
                Banani Studio Team • Saturday – Thursday
              </span>
            </div>
          </div>
        </div>

        {/* 7-Point Customer Help & Resolution Guide */}
        <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-[#E7E3DC] pb-4">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[#181818]">
              Customer Help &amp; Issue Resolution Directory
            </h2>
            <p className="text-xs text-[#74716D] mt-1">
              Practical instructions for handling common order, payment, and delivery scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#74716D]">
            <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] space-y-1.5">
              <h4 className="font-bold text-[#181818] uppercase tracking-wide">1. Order Confirmation</h4>
              <p className="leading-relaxed">
                Confirmations are emailed immediately upon placing an order. If you do not see it in your inbox or spam folder, check your order history under <strong className="text-[#181818]">Account &gt; Orders</strong> or message us with your phone number.
              </p>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] space-y-1.5">
              <h4 className="font-bold text-[#181818] uppercase tracking-wide">2. Payment Inquiries</h4>
              <p className="leading-relaxed">
                If your card or mobile wallet was charged but your screen timed out, email <strong className="text-[#181818]">support@flashwear.store</strong> with your bank/bKash Transaction ID (TrxID) for immediate payment reconciliation.
              </p>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] space-y-1.5">
              <h4 className="font-bold text-[#181818] uppercase tracking-wide">3. Delivery Address Changes</h4>
              <p className="leading-relaxed">
                Need to correct an address or phone number? Notify support via WhatsApp or email before your order enters <strong className="text-[#181818]">Shipped</strong> status so we can update the courier consignment before dispatch.
              </p>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] space-y-1.5">
              <h4 className="font-bold text-[#181818] uppercase tracking-wide">4. Delayed Shipments</h4>
              <p className="leading-relaxed">
                Standard delivery is 1–2 days in Dhaka and 3–5 days outside Dhaka. Use the live courier tracking link provided in your shipping notification to locate the transit hub, or contact us to escalate with the dispatch rider.
              </p>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] space-y-1.5">
              <h4 className="font-bold text-[#181818] uppercase tracking-wide">5. Size &amp; Fit Exchanges</h4>
              <p className="leading-relaxed">
                Log into your customer account, open your order, and click <strong className="text-[#181818]">Request Return / Exchange</strong> within 7 days of delivery. Items must have security tags intact and be completely unworn.
              </p>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] space-y-1.5">
              <h4 className="font-bold text-[#181818] uppercase tracking-wide">6. Damaged or Incorrect Products</h4>
              <p className="leading-relaxed">
                In the rare event of a defective piece or incorrect style, send a clear photo or unboxing video to our WhatsApp within 48 hours of parcel receipt. We will dispatch an expedited replacement at no extra delivery fee.
              </p>
            </div>

            <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] space-y-1.5 md:col-span-2">
              <h4 className="font-bold text-[#181818] uppercase tracking-wide">7. Customer Account Access</h4>
              <p className="leading-relaxed">
                If you cannot sign in or need your registered email updated, use the password reset form or email our studio desk with your registered phone number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
