import React from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Contact & Studio Support",
  description: "Get in touch with the FLASHWEAR studio team in Dhaka, Bangladesh.",
};

export default function ContactPage() {
  return (
    <div className="bg-[#0a0a0b] min-h-screen py-16 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="border-b border-zinc-800 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccff00]">
            Direct Communication
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-2">
            Contact & Support
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            Have questions regarding sizing, parcel dispatch, or order status? We are here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-white border-b border-zinc-800 pb-2">
                Customer Care Desk
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#ccff00] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-500 block">Phone & WhatsApp Support:</span>
                    <strong className="text-white font-mono">+880 1700-000000</strong>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#ccff00] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-500 block">Email Inquiries:</span>
                    <strong className="text-white font-mono">support@flashwear.store</strong>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#ccff00] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-500 block">Design Studio:</span>
                    <strong className="text-white">Road 11, Block C, Banani, Dhaka 1213</strong>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#ccff00] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-500 block">Operational Hours:</span>
                    <strong className="text-white">10:00 AM – 10:00 PM (Saturday - Thursday)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Message Note */}
          <div className="p-6 bg-[#111113] border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-mono uppercase font-bold text-white border-b border-zinc-800 pb-2">
                Order Tracking & Exchanges
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                For order status inquiries, please include your <strong>Order Number (e.g. FW-2026XXXX-XXXX)</strong> when messaging us on WhatsApp or emailing support.
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Exchange requests are accepted within 7 days of parcel delivery if items are in unworn condition with tags attached.
              </p>
            </div>
            <div className="pt-6 border-t border-zinc-800/80">
              <span className="inline-block text-[11px] font-mono text-[#ccff00] bg-zinc-900 border border-zinc-800 px-3 py-1.5">
                Avg Response Time: Under 2 Hours
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
