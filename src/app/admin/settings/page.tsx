import React from "react";
import { getSiteSettings } from "@/lib/services/catalog";
import { SettingsForm } from "@/components/admin/settings-form";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-zinc-800">
        <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
          Platform Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Store Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage nationwide delivery rates, low stock alert boundaries, and storefront contact channels.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
