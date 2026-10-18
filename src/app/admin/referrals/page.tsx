"use client";

import { useState, useEffect } from "react";
import { Share2, Save, Users, RefreshCw, CheckCircle2, ShieldCheck, Gift } from "lucide-react";
import { ReferralSettings, CustomerReferral } from "@/lib/types";

export default function AdminReferralsPage() {
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [referrals, setReferrals] = useState<CustomerReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/referrals");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setReferrals(data.referrals || []);
      }
    } catch (err) {
      console.error("Failed to load referral settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving referral settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-400 font-mono text-sm animate-pulse">Loading referral settings & conversions...</div>
      </div>
    );
  }

  const totalReferrals = referrals.length;
  const rewardedReferrals = referrals.filter((r) => r.status === "rewarded").length;
  const pendingReferrals = referrals.filter((r) => r.status === "pending").length;
  const totalPointsDistributed = referrals.reduce((sum, r) => sum + r.referrer_points_awarded, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ccff00] mb-1">
            <Share2 className="w-4 h-4" />
            <span>GROWTH & RETENTION</span>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Customer Referral Program</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure friend-get-friend welcome discounts, referrer bonus points, and review conversion logs.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Referral parameters updated successfully!</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#121214] border border-zinc-800 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs uppercase font-mono">Total Invitations</span>
            <Users className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-white font-mono">{totalReferrals}</span>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs uppercase font-mono">Rewarded Conversions</span>
            <Gift className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">{rewardedReferrals}</span>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs uppercase font-mono">Pending Delivery</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono">{pendingReferrals}</span>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs uppercase font-mono">Points Distributed</span>
            <Gift className="w-4 h-4 text-[#ccff00]" />
          </div>
          <span className="text-2xl font-black text-[#ccff00] font-mono">{totalPointsDistributed}</span>
        </div>
      </div>

      {/* Program Settings Form */}
      {settings && (
        <form onSubmit={handleSaveSettings} className="bg-[#121214] border border-zinc-800 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Referral Reward Economics</h2>
              <p className="text-xs text-zinc-400">Configure welcome voucher for new customers and rewards for referrers</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                {settings.is_active ? "Program Active" : "Program Disabled"}
              </span>
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                className="w-5 h-5 accent-[#ccff00] rounded"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Referrer Reward (Points)
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={settings.referrer_reward_points}
                onChange={(e) => setSettings({ ...settings, referrer_reward_points: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Points credited once order is delivered</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Friend Welcome Discount (BDT)
              </label>
              <input
                type="number"
                min="50"
                step="10"
                value={settings.referee_discount_amount}
                onChange={(e) => setSettings({ ...settings, referee_discount_amount: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Instant discount applied on referee's first cart</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Min. Qualifying Order (BDT)
              </label>
              <input
                type="number"
                min="500"
                step="100"
                value={settings.min_qualifying_order_amount}
                onChange={(e) => setSettings({ ...settings, min_qualifying_order_amount: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Minimum cart subtotal to qualify</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Max Referrals per User
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={settings.max_referrals_per_user}
                onChange={(e) => setSettings({ ...settings, max_referrals_per_user: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Limits abuse on single accounts</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Referral Economics"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Referrals Activity Table */}
      <div className="bg-[#121214] border border-zinc-800 p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Customer Referral Logs</h2>
            <p className="text-xs text-zinc-400">Real-time log of customer referral codes, friends invited, and qualification states</p>
          </div>
          <button
            onClick={fetchReferralData}
            className="p-2 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {referrals.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-mono">
            No referral conversions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Referral Code</th>
                  <th className="py-3 px-2">Referee Details</th>
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Points Awarded</th>
                  <th className="py-3 px-2 text-right">Welcome Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-zinc-900/50">
                    <td className="py-2.5 px-2 text-zinc-400 font-mono text-[11px]">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-[#ccff00]">
                      {ref.referral_code}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-300">
                      {ref.referee_email || ref.referee_phone || "Customer"}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400 font-mono text-[11px]">
                      {ref.order_id ? ref.order_id.slice(0, 10) + "..." : "—"}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                          ref.status === "rewarded"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : ref.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-white">
                      {ref.referrer_points_awarded > 0 ? `+${ref.referrer_points_awarded}` : "0"}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-zinc-300">
                      ৳{ref.referee_discount_applied}
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
