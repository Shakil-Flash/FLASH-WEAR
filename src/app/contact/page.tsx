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

          {/* Direct Message Note */}
          <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818] border-b border-[#E7E3DC] pb-2">
                Order Tracking &amp; Exchanges
              </h3>
              <p className="text-xs text-[#74716D] leading-relaxed">
                For order status updates, please have your <strong className="text-[#181818]">Order Number</strong> ready when messaging us on WhatsApp or emailing support.
              </p>
              <p className="text-xs text-[#74716D] leading-relaxed">
                Exchange requests are accepted within 7 days of delivery as long as garments are unworn and tags remain intact.
              </p>
            </div>
            <div className="pt-6 border-t border-[#E7E3DC]">
              <span className="inline-block text-xs font-semibold text-[#FF5938] bg-[#FFF5F3] border border-[#FF5938]/20 px-3 py-1.5 rounded-full">
                Average response time: Under 2 hours
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
