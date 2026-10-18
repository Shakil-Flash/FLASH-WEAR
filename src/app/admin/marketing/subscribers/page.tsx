import Link from "next/link";
import { Users, ArrowLeft, ShieldCheck, MailX, CheckCircle } from "lucide-react";
import { getSubscribersList } from "@/lib/services/marketing";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const { total, active, unsubscribed, subscribers } = await getSubscribersList();

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
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Consented Audience & Subscribers</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Privacy-compliant opt-in marketing subscriber directory with explicit consent timestamps.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121214] border border-zinc-800 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs uppercase font-mono">Total Contacts</span>
            <Users className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{total}</span>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs uppercase font-mono">Active Mailable</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">{active}</span>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs uppercase font-mono">Suppressed / Unsubscribed</span>
            <MailX className="w-4 h-4 text-zinc-500" />
          </div>
          <span className="text-2xl font-black text-zinc-400 font-mono">{unsubscribed}</span>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-[#121214] border border-zinc-800 p-6">
        {subscribers.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500 font-mono">
            No newsletter subscribers registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-2">Email Address</th>
                  <th className="py-3 px-2">Opt-in Source</th>
                  <th className="py-3 px-2">Consent Timestamp</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Unsubscribe Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-900/50">
                    <td className="py-3 px-2 font-mono text-white">
                      {sub.email}
                    </td>
                    <td className="py-3 px-2 text-zinc-400 font-mono text-[11px]">
                      {sub.source.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-2 text-zinc-300 font-mono text-[11px]">
                      {new Date(sub.consent_given_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                          sub.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-zinc-500 font-mono text-[11px]">
                      {sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString() : "—"}
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
