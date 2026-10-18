"use client";

import { useState, useEffect } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { Award, Zap, ArrowUpRight, ArrowDownLeft, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { LoyaltyPointsLedgerEntry, LoyaltySettings } from "@/lib/types";

export default function AccountRewardsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [ledger, setLedger] = useState<LoyaltyPointsLedgerEntry[]>([]);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRewards() {
      try {
        const res = await fetch("/api/account/rewards");
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance || 0);
          setLedger(data.ledger || []);
          setSettings(data.settings || null);
        }
      } catch (err) {
        console.error("Error loading rewards:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRewards();
  }, []);

  const pointValue = settings?.point_value_bdt || 0.50;
  const monetaryValue = Math.round(balance * pointValue);

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ccff00] mb-2">
            <Award className="w-4 h-4" />
            <span>FLASH CLUB MEMBERSHIP</span>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">Loyalty & Rewards</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Earn points on every streetwear drop and redeem them for instant discounts at checkout.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <main className="flex-1 w-full space-y-6">
            {/* Balance Overview Card */}
            <div className="bg-[#121214] border border-zinc-800 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Available Loyalty Points</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-[#ccff00] font-mono">
                      {loading ? "..." : balance.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">PTS</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-2">
                    Equivalent to <strong className="text-white font-mono">৳{monetaryValue.toLocaleString()}</strong> store discount.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/shop"
                    className="px-6 py-3 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider text-center transition-colors shadow-lg shadow-[#ccff00]/10"
                  >
                    Shop & Earn Points
                  </Link>
                  <Link
                    href="/checkout"
                    className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider text-center transition-colors"
                  >
                    Redeem at Checkout
                  </Link>
                </div>
              </div>

              {/* Quick Earning Rules Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ccff00] shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-white">Earn on Every ৳100</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Get {settings?.points_per_100_bdt || 10} points for every ৳100 spent on delivered orders.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ccff00] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-white">Minimum Redemption</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Redeem starting from {settings?.min_redemption_points || 100} points (৳{((settings?.min_redemption_points || 100) * pointValue).toFixed(0)} off).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ccff00] shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-white">Max Cap Per Order</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Up to {settings?.max_redemption_points || 1000} points (৳{((settings?.max_redemption_points || 1000) * pointValue).toFixed(0)} off) per order.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Points Activity Ledger */}
            <div className="bg-[#121214] border border-zinc-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Points Activity Ledger
              </h3>

              {loading ? (
                <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading activity...</div>
              ) : ledger.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800/80 p-6">
                  <Award className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400 font-medium">No loyalty transactions recorded yet.</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Your points will appear here once your orders are delivered or friend referrals qualify.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Activity</th>
                        <th className="py-3 px-2 text-right">Points</th>
                        <th className="py-3 px-2 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {ledger.map((entry) => {
                        const isCredit = entry.points > 0;
                        return (
                          <tr key={entry.id} className="hover:bg-zinc-900/50 transition-colors">
                            <td className="py-3 px-2 text-zinc-400 font-mono text-[11px]">
                              {new Date(entry.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`p-1 rounded ${
                                    isCredit ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                </span>
                                <div>
                                  <span className="font-semibold text-white capitalize">
                                    {entry.event_type.replace(/_/g, " ")}
                                  </span>
                                  {entry.notes && (
                                    <p className="text-[11px] text-zinc-400 truncate max-w-xs">{entry.notes}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td
                              className={`py-3 px-2 text-right font-mono font-bold ${
                                isCredit ? "text-emerald-400" : "text-zinc-400"
                              }`}
                            >
                              {isCredit ? `+${entry.points}` : entry.points}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-zinc-300">
                              {entry.balance_after.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
