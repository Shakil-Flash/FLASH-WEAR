"use client";

import { useState, useEffect } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { Share2, Copy, Check, Users, Gift, Clock, AlertCircle } from "lucide-react";
import { CustomerReferral, ReferralSettings } from "@/lib/types";

export default function AccountReferralsPage() {
  const [referralCode, setReferralCode] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [totalReferred, setTotalReferred] = useState<number>(0);
  const [rewardedCount, setRewardedCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState<number>(0);
  const [referrals, setReferrals] = useState<CustomerReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReferrals() {
      try {
        const res = await fetch("/api/account/referrals");
        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.referralCode || "");
          setShareLink(data.shareLink || "");
          setSettings(data.settings || null);
          setTotalReferred(data.totalReferred || 0);
          setRewardedCount(data.rewardedCount || 0);
          setPendingCount(data.pendingCount || 0);
          setTotalPointsEarned(data.totalPointsEarned || 0);
          setReferrals(data.referrals || []);
        }
      } catch (err) {
        console.error("Error loading referrals:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReferrals();
  }, []);

  const handleCopy = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Get ৳${settings?.referee_discount_amount || 150} off your first streetwear drop at FLASHWEAR using my referral link!`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareLink)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ccff00] mb-2">
            <Share2 className="w-4 h-4" />
            <span>COMMUNITY GROWTH</span>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">Refer a Friend</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Give your friends ৳{settings?.referee_discount_amount || 150} off, and earn {settings?.referrer_reward_points || 200} points when their order is delivered.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <main className="flex-1 w-full space-y-6">
            {/* Share Card */}
            <div className="bg-[#121214] border border-zinc-800 p-6 sm:p-8 relative overflow-hidden">
              <div className="max-w-xl">
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Your Personal Referral Link</span>
                <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={loading ? "Generating link..." : shareLink}
                    className="flex-1 bg-zinc-900 border border-zinc-700 px-4 py-3 text-xs font-mono text-[#ccff00] focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-6 py-3 bg-[#ccff00] hover:bg-[#b8e600] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-4 text-xs text-zinc-400">
                  <span>Referral Code:</span>
                  <span className="font-mono font-bold text-white bg-zinc-800 px-2.5 py-1 rounded border border-zinc-700">
                    {referralCode || "..."}
                  </span>
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center gap-3 mt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Share Via:</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-bold uppercase tracking-wider rounded border border-[#25D366]/30 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] text-xs font-bold uppercase tracking-wider rounded border border-[#1877F2]/30 transition-colors"
                  >
                    Facebook
                  </a>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider rounded border border-zinc-700 transition-colors"
                  >
                    X / Twitter
                  </a>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-[#121214] border border-zinc-800 p-5">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs uppercase font-mono">Friends Invited</span>
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-2xl font-black text-white font-mono">{totalReferred}</span>
              </div>

              <div className="bg-[#121214] border border-zinc-800 p-5">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs uppercase font-mono">Successful</span>
                  <Gift className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-emerald-400 font-mono">{rewardedCount}</span>
              </div>

              <div className="bg-[#121214] border border-zinc-800 p-5">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs uppercase font-mono">Pending Delivery</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-2xl font-black text-amber-400 font-mono">{pendingCount}</span>
              </div>

              <div className="bg-[#121214] border border-zinc-800 p-5">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-xs uppercase font-mono">Points Earned</span>
                  <Gift className="w-4 h-4 text-[#ccff00]" />
                </div>
                <span className="text-2xl font-black text-[#ccff00] font-mono">{totalPointsEarned}</span>
              </div>
            </div>

            {/* Terms & Anti-Abuse Explanation */}
            <div className="bg-[#121214] border border-zinc-800 p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ccff00]" />
                <span>Program Terms & Rules</span>
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                <li>Your friend gets ৳{settings?.referee_discount_amount || 150} off their first purchase when ordering ৳{settings?.min_qualifying_order_amount || 1000} or more.</li>
                <li>You receive {settings?.referrer_reward_points || 200} points once their qualifying order is successfully delivered.</li>
                <li>Self-referrals (using own code, duplicate accounts, or matching phone numbers) are automatically blocked by the server.</li>
                <li>If a referred order is returned or cancelled, the associated points are reversed.</li>
              </ul>
            </div>

            {/* Referrals Activity Table */}
            <div className="bg-[#121214] border border-zinc-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Referral History
              </h3>

              {loading ? (
                <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading referrals...</div>
              ) : referrals.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800/80 p-6">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400 font-medium">No referral invitations recorded yet.</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Share your unique link above with fellow streetwear lovers to start earning rewards.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[11px]">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Referee</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Points Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-3 px-2 text-zinc-400 font-mono text-[11px]">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 text-white font-medium">
                            {ref.referee_email ? ref.referee_email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "Friend"}
                          </td>
                          <td className="py-3 px-2">
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
                          <td className="py-3 px-2 text-right font-mono font-bold text-[#ccff00]">
                            {ref.referrer_points_awarded > 0 ? `+${ref.referrer_points_awarded}` : "—"}
                          </td>
                        </tr>
                      ))}
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
