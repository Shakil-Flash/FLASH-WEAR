import Link from "next/link";
import { Mail, Users, Send, ShoppingBag, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { getSubscribersList, getMarketingCampaigns } from "@/lib/services/marketing";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  const [subscribersData, campaigns] = await Promise.all([
    getSubscribersList(),
    getMarketingCampaigns(),
  ]);

  const activeSubscribers = subscribersData.active;
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter((c) => c.status === "sent").length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ccff00] mb-1">
          <Mail className="w-4 h-4" />
          <span>CUSTOMER RETENTION & OUTREACH</span>
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Marketing & Campaigns Hub</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage consented newsletter audiences, compose drop announcements, and execute abandoned cart recovery.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121214] border border-zinc-800 p-6">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-mono">Consented Subscribers</span>
            <Users className="w-5 h-5 text-[#ccff00]" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{activeSubscribers}</div>
          <p className="text-xs text-zinc-500 mt-2">
            {subscribersData.unsubscribed} total unsubscribed contacts suppressed
          </p>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-6">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-mono">Email Campaigns</span>
            <Send className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{sentCampaigns} / {totalCampaigns}</div>
          <p className="text-xs text-zinc-500 mt-2">Sent / total created promotional campaigns</p>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-6">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase font-mono">Consent Compliance</span>
            <ShieldCheck className="w-5 h-5 text-[#ccff00]" />
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1">100% Opt-in Audited</div>
          <p className="text-xs text-zinc-500 mt-2">One-click unsubscribe tokens enforced on all dispatches</p>
        </div>
      </div>

      {/* Feature Modules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaigns Card */}
        <div className="bg-[#121214] border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#ccff00] mb-4">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-tight text-white">Email Drop Campaigns</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Compose promotional broadcasts for streetwear drops, flash sales, and seasonal lookbooks. Send test previews to verify layouts before dispatching to subscribers.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between">
            <Link
              href="/admin/marketing/campaigns"
              className="text-xs font-bold uppercase tracking-wider text-[#ccff00] hover:underline flex items-center gap-1.5"
            >
              <span>View Campaigns ({totalCampaigns})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/marketing/campaigns/new"
              className="px-4 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider transition-colors"
            >
              + Create Campaign
            </Link>
          </div>
        </div>

        {/* Subscribers Card */}
        <div className="bg-[#121214] border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#ccff00] mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-tight text-white">Audience & Subscribers</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Inspect opt-in subscriber lists, audit consent timestamps, and manage unsubscription suppressions across all storefront and checkout channels.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between">
            <Link
              href="/admin/marketing/subscribers"
              className="text-xs font-bold uppercase tracking-wider text-[#ccff00] hover:underline flex items-center gap-1.5"
            >
              <span>Manage Audience ({subscribersData.total})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
