"use client";

import { useState, useEffect } from "react";
import { Award, Save, RefreshCw, PlusCircle, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import { LoyaltySettings, LoyaltyPointsLedgerEntry } from "@/lib/types";

export default function AdminLoyaltyPage() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [ledger, setLedger] = useState<LoyaltyPointsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Manual Adjustment State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [adjustPoints, setAdjustPoints] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/loyalty");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setLedger(data.recentLedger || []);
      }
    } catch (err) {
      console.error("Failed to load loyalty settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !adjustReason) return;
    setAdjusting(true);
    setAdjustMessage(null);

    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          points: Number(adjustPoints),
          reason: adjustReason,
          adminActor: "admin@flashwear.store",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdjustMessage({ type: "success", text: `Successfully updated balance! New balance: ${data.newBalance} pts` });
        setTargetUserId("");
        setAdjustReason("");
        fetchLoyaltyData();
        setTimeout(() => {
          setShowAdjustModal(false);
          setAdjustMessage(null);
        }, 2000);
      } else {
        setAdjustMessage({ type: "error", text: data.error || "Failed to adjust balance" });
      }
    } catch (err: any) {
      setAdjustMessage({ type: "error", text: err.message || "Request failed" });
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-400 font-mono text-sm animate-pulse">Loading loyalty rules & ledger...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ccff00] mb-1">
            <Award className="w-4 h-4" />
            <span>OPERATIONAL SETTINGS</span>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Loyalty & Rewards Program</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure earning rules, point conversion rates, redemption thresholds, and monitor the auditable ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#ccff00]" />
            <span>Manual Adjustment</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Loyalty rules updated successfully! Changes will take effect immediately.</span>
        </div>
      )}

      {/* Rules Configuration Form */}
      {settings && (
        <form onSubmit={handleSaveSettings} className="bg-[#121214] border border-zinc-800 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Program Parameters</h2>
              <p className="text-xs text-zinc-400">Control how points are earned, redeemed, and combined</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Points per ৳100 Spent
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.points_per_100_bdt}
                onChange={(e) => setSettings({ ...settings, points_per_100_bdt: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Default: 10 pts per ৳100 (10% rebate in points)</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Monetary Value per Point (BDT)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="10"
                value={settings.point_value_bdt}
                onChange={(e) => setSettings({ ...settings, point_value_bdt: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">1 point = ৳{settings.point_value_bdt} (100 pts = ৳{(100 * settings.point_value_bdt).toFixed(0)})</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Min. Points to Redeem
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={settings.min_redemption_points}
                onChange={(e) => setSettings({ ...settings, min_redemption_points: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Minimum balance required for checkout discount</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Max. Points per Order
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={settings.max_redemption_points}
                onChange={(e) => setSettings({ ...settings, max_redemption_points: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Maximum ৳{(settings.max_redemption_points * settings.point_value_bdt).toFixed(0)} discount per order</span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Points Expiry (Days)
              </label>
              <input
                type="number"
                min="30"
                max="730"
                value={settings.points_expiry_days}
                onChange={(e) => setSettings({ ...settings, points_expiry_days: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#ccff00]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">Days before unspent points expire</span>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.can_combine_with_coupon}
                  onChange={(e) => setSettings({ ...settings, can_combine_with_coupon: e.target.checked })}
                  className="w-4 h-4 accent-[#ccff00] rounded"
                />
                <span className="text-xs font-semibold text-zinc-300">
                  Allow Stacking With Coupons
                </span>
              </label>
              <span className="text-[11px] text-zinc-500 mt-1">If unchecked, customers cannot apply both points and promo codes.</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Loyalty Rules"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Auditable Ledger Table */}
      <div className="bg-[#121214] border border-zinc-800 p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Audit Ledger (Recent 50 Events)</h2>
            <p className="text-xs text-zinc-400">Immutable ledger trail of all points earned, redeemed, or administratively adjusted</p>
          </div>
          <button
            onClick={fetchLoyaltyData}
            className="p-2 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {ledger.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-mono">
            No points ledger entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-2">Timestamp</th>
                  <th className="py-3 px-2">User ID</th>
                  <th className="py-3 px-2">Event</th>
                  <th className="py-3 px-2 text-right">Points</th>
                  <th className="py-3 px-2 text-right">Balance After</th>
                  <th className="py-3 px-2">Notes & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {ledger.map((entry) => {
                  const isCredit = entry.points > 0;
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-900/50">
                      <td className="py-2.5 px-2 text-zinc-400 font-mono text-[11px]">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-300 font-mono text-[11px]">
                        {entry.user_id.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="font-semibold text-white capitalize">
                          {entry.event_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-2 text-right font-mono font-bold ${
                          isCredit ? "text-emerald-400" : "text-zinc-400"
                        }`}
                      >
                        {isCredit ? `+${entry.points}` : entry.points}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-zinc-300 font-bold">
                        {entry.balance_after.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-zinc-400 text-[11px] truncate max-w-xs">
                        {entry.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Point Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-zinc-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-white">Manual Loyalty Points Adjustment</h3>
            <p className="text-xs text-zinc-400">
              Credit or debit points with a mandatory administrative audit reason.
            </p>

            {adjustMessage && (
              <div
                className={`p-3 text-xs ${
                  adjustMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {adjustMessage.text}
              </div>
            )}

            <form onSubmit={handleManualAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Target User ID (UUID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#ccff00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Points Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#ccff00]"
                />
                <span className="text-[11px] text-zinc-500">Positive to credit points; negative to debit points.</span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Reason / Note (Required)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Customer goodwill resolution for delayed order #FW-1029"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white text-xs uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {adjusting ? "Processing..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
