import Link from "next/link";
import { Mail, Plus, Send, RefreshCw, Calendar, ArrowLeft } from "lucide-react";
import { getMarketingCampaigns } from "@/lib/services/marketing";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const campaigns = await getMarketingCampaigns();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Link
            href="/admin/marketing"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white uppercase font-bold tracking-wider mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketing Hub</span>
          </Link>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Email Drop Campaigns</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create, test, schedule, and broadcast promotional campaigns to consented subscribers.
          </p>
        </div>

        <div>
          <Link
            href="/admin/marketing/campaigns/new"
            className="px-5 py-2.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-[#121214] border border-zinc-800 p-6">
        {campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <Mail className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white uppercase">No Campaigns Created Yet</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Draft promotional announcements for streetwear releases, seasonal sales, or exclusive discount drops.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/marketing/campaigns/new"
                className="px-6 py-2.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider inline-block"
              >
                Create Your First Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-2">Campaign Title</th>
                  <th className="py-3 px-2">Subject Line</th>
                  <th className="py-3 px-2">Segment</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Audience</th>
                  <th className="py-3 px-2 text-right">Sent / Failed</th>
                  <th className="py-3 px-2 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-900/50">
                    <td className="py-3 px-2 font-bold text-white">
                      {c.title}
                    </td>
                    <td className="py-3 px-2 text-zinc-300 truncate max-w-xs">
                      {c.subject}
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-zinc-400">
                      {c.target_segment.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                          c.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : c.status === "sending"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : c.status === "scheduled"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-white">
                      {c.recipient_count || "—"}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-zinc-400">
                      {c.sent_count} / {c.failed_count}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-zinc-400 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
