"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteSettings } from "@/lib/types";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface SettingsFormProps {
  settings: SiteSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    storeName: settings.store_name,
    contactEmail: settings.contact_email,
    contactPhone: settings.contact_phone,
    dhakaDeliveryFee: settings.dhaka_delivery_fee.toString(),
    outsideDhakaDeliveryFee: settings.outside_dhaka_delivery_fee.toString(),
    lowStockThreshold: settings.low_stock_threshold.toString(),
    freeShippingThreshold: settings.free_shipping_threshold ? settings.free_shipping_threshold.toString() : "",
    announcementText: settings.announcement_text || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update settings");
      }

      setMessage({ text: "Store settings successfully persisted in database.", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {message && (
        <div
          className={`p-4 border text-xs font-mono flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Brand Identity & Contact */}
      <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
          Store Details & Support Channels
        </h3>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-mono text-zinc-400">Store Name</label>
          <input
            type="text"
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Support Email</label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Contact / WhatsApp Phone</label>
            <input
              type="text"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-mono text-zinc-400">Top Header Announcement Bar Text</label>
          <input
            type="text"
            value={formData.announcementText}
            onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
            className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
          />
        </div>
      </div>

      {/* Delivery Fee Settings */}
      <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
          Bangladesh Cash On Delivery Rates & Thresholds
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Dhaka City Delivery Fee (BDT ৳)</label>
            <input
              type="number"
              value={formData.dhakaDeliveryFee}
              onChange={(e) => setFormData({ ...formData, dhakaDeliveryFee: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Outside Dhaka Delivery Fee (BDT ৳)</label>
            <input
              type="number"
              value={formData.outsideDhakaDeliveryFee}
              onChange={(e) => setFormData({ ...formData, outsideDhakaDeliveryFee: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Low Stock Warning Threshold (Units)</label>
            <input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Free Shipping Minimum Subtotal (BDT ৳)</label>
            <input
              type="number"
              value={formData.freeShippingThreshold}
              onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
              placeholder="3000"
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-8 py-3.5 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-zinc-800 text-black font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-colors shadow-lg"
      >
        <Save className="w-4 h-4" />
        <span>{isSubmitting ? "Persisting Settings..." : "Save Store Settings"}</span>
      </button>
    </form>
  );
}
