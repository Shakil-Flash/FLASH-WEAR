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
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            <Award className="w-4 h-4" />
            <span>FLASH CLUB MEMBERSHIP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">Loyalty &amp; Rewards</h1>
          <p className="text-xs sm:text-sm text-[#74716D] mt-1">
            Earn points on every apparel order and redeem them for discounts at checkout.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <main className="flex-1 w-full space-y-6">
            {/* Balance Overview Card */}
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div>
                  <span className="text-xs uppercase font-medium tracking-wider text-[#74716D]">
                    Available Loyalty Points
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-[#181818]">
                      {loading ? "..." : balance.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FF5938]">PTS</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#74716D] mt-2">
                    Equivalent to <strong className="text-[#181818] font-bold">৳{monetaryValue.toLocaleString()}</strong> store discount at checkout.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/shop"
                    className="px-6 py-3 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-xs rounded-lg text-center transition-colors shadow-sm"
                  >
                    Shop &amp; Earn Points
                  </Link>
                  <Link
                    href="/checkout"
                    className="px-6 py-3 bg-white hover:bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] font-medium text-xs rounded-lg text-center transition-colors"
                  >
                    Redeem at Checkout
                  </Link>
                </div>
              </div>

              {/* Quick Earning Rules Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#E7E3DC]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E7E3DC] flex items-center justify-center text-[#FF5938] shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-[#181818]">Earn on Every ৳100</h4>
                    <p className="text-[11px] text-[#74716D] mt-0.5 leading-relaxed">
                      Get {settings?.points_per_100_bdt || 10} points for every ৳100 spent on delivered orders.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E7E3DC] flex items-center justify-center text-[#FF5938] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-[#181818]">Minimum Redemption</h4>
                    <p className="text-[11px] text-[#74716D] mt-0.5 leading-relaxed">
                      Redeem starting from {settings?.min_redemption_points || 100} points (৳{((settings?.min_redemption_points || 100) * pointValue).toFixed(0)} off).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E7E3DC] flex items-center justify-center text-[#FF5938] shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-[#181818]">Max Cap Per Order</h4>
                    <p className="text-[11px] text-[#74716D] mt-0.5 leading-relaxed">
                      Up to {settings?.max_redemption_points || 1000} points (৳{((settings?.max_redemption_points || 1000) * pointValue).toFixed(0)} off) per order.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Points Activity Ledger */}
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818] mb-4">
                Points Activity Ledger
              </h3>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#74716D]">Loading activity...</div>
              ) : ledger.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-[#E7E3DC] rounded-lg p-6">
                  <Award className="w-8 h-8 text-[#74716D] mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-[#181818] font-medium">No loyalty transactions recorded yet.</p>
                  <p className="text-xs text-[#74716D] mt-1">
                    Your points will appear here once your orders are delivered or friend referrals qualify.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E7E3DC] text-[#74716D] uppercase text-[11px]">
                        <th className="py-3 px-2 font-medium">Date</th>
                        <th className="py-3 px-2 font-medium">Activity</th>
                        <th className="py-3 px-2 text-right font-medium">Points</th>
                        <th className="py-3 px-2 text-right font-medium">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E3DC]">
                      {ledger.map((entry) => {
                        const isCredit = entry.points > 0;
                        return (
                          <tr key={entry.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                            <td className="py-3 px-2 text-[#74716D] text-[11px]">
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
                                    isCredit ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                </span>
                                <div>
                                  <span className="font-semibold text-[#181818] capitalize">
                                    {entry.event_type.replace(/_/g, " ")}
                                  </span>
                                  {entry.notes && (
                                    <p className="text-[11px] text-[#74716D] truncate max-w-xs">{entry.notes}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td
                              className={`py-3 px-2 text-right font-semibold ${
                                isCredit ? "text-emerald-700" : "text-[#74716D]"
                              }`}
                            >
                              {isCredit ? `+${entry.points}` : entry.points}
                            </td>
                            <td className="py-3 px-2 text-right text-[#181818] font-medium">
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
