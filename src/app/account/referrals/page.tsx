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
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            <Share2 className="w-4 h-4" />
            <span>Community Program</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">Refer a Friend</h1>
          <p className="text-xs sm:text-sm text-[#74716D] mt-1">
            Give your friends ৳{settings?.referee_discount_amount || 150} off, and earn {settings?.referrer_reward_points || 200} points when their order is delivered.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <main className="flex-1 w-full space-y-6">
            {/* Share Card */}
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="max-w-xl">
                <span className="text-xs uppercase font-medium tracking-wider text-[#74716D]">
                  Your Personal Referral Link
                </span>
                <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={loading ? "Generating link..." : shareLink}
                    className="flex-1 bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg px-4 py-2.5 text-xs text-[#181818] focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-5 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
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

                <div className="flex items-center gap-2 mt-4 text-xs text-[#74716D]">
                  <span>Referral Code:</span>
                  <span className="font-bold text-[#181818] bg-[#F7F5F0] px-2.5 py-1 rounded-md border border-[#E7E3DC]">
                    {referralCode || "..."}
                  </span>
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center gap-2 mt-5">
                  <span className="text-xs font-medium text-[#74716D] mr-1">Share via:</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium rounded-lg border border-blue-200 transition-colors"
                  >
                    Facebook
                  </a>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#F7F5F0] hover:bg-[#E7E3DC] text-[#181818] text-xs font-medium rounded-lg border border-[#E7E3DC] transition-colors"
                  >
                    X
                  </a>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#74716D] mb-1">
                  <span className="text-xs font-medium uppercase">Friends Invited</span>
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-2xl font-bold text-[#181818]">{totalReferred}</span>
              </div>

              <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#74716D] mb-1">
                  <span className="text-xs font-medium uppercase">Successful</span>
                  <Gift className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-2xl font-bold text-emerald-700">{rewardedCount}</span>
              </div>

              <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#74716D] mb-1">
                  <span className="text-xs font-medium uppercase">Pending Delivery</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
              </div>

              <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#74716D] mb-1">
                  <span className="text-xs font-medium uppercase">Points Earned</span>
                  <Gift className="w-4 h-4 text-[#FF5938]" />
                </div>
                <span className="text-2xl font-bold text-[#FF5938]">{totalPointsEarned}</span>
              </div>
            </div>

            {/* Terms & Anti-Abuse Explanation */}
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#181818] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF5938]" />
                <span>Program Terms &amp; Rules</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-[#74716D] list-disc list-inside leading-relaxed">
                <li>Your friend gets ৳{settings?.referee_discount_amount || 150} off their first purchase when ordering ৳{settings?.min_qualifying_order_amount || 1000} or more.</li>
                <li>You receive {settings?.referrer_reward_points || 200} points once their qualifying order is delivered.</li>
                <li>Self-referrals (duplicate accounts or matching numbers) are automatically filtered.</li>
                <li>If a referred order is returned, the associated reward points are adjusted.</li>
              </ul>
            </div>

            {/* Referrals Activity Table */}
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818] mb-4">
                Referral History
              </h3>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#74716D]">Loading referrals...</div>
              ) : referrals.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-[#E7E3DC] rounded-lg p-6">
                  <Users className="w-8 h-8 text-[#74716D] mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-[#181818] font-medium">No referral invitations recorded yet.</p>
                  <p className="text-xs text-[#74716D] mt-1">
                    Share your unique link above with friends to start earning rewards.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E7E3DC] text-[#74716D] uppercase text-[11px]">
                        <th className="py-3 px-2 font-medium">Date</th>
                        <th className="py-3 px-2 font-medium">Referee</th>
                        <th className="py-3 px-2 font-medium">Status</th>
                        <th className="py-3 px-2 text-right font-medium">Points Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E3DC]">
                      {referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                          <td className="py-3 px-2 text-[#74716D] text-[11px]">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 text-[#181818] font-medium">
                            {ref.referee_email ? ref.referee_email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "Friend"}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded-full ${
                                ref.status === "rewarded"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : ref.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {ref.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-semibold text-[#FF5938]">
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
