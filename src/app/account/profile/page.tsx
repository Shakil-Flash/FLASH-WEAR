"use client";

import { useState } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { User, Phone, Mail, Lock, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("Tanzim Shakil");
  const [email] = useState("customer@flashwear.store");
  const [phone, setPhone] = useState("01712345678");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr-demo", fullName, phone }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully!");
      }
    } catch {
      setMessage("Update failed, please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#ccff00] font-mono mb-1">
            {"// PERSONAL DETAILS"}
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Profile &amp; Security
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />

          <main className="flex-1 space-y-6">
            <div className="bg-[#121214] border border-zinc-800 p-6">
              <div className="mb-6 pb-4 border-b border-zinc-800">
                <h2 className="text-base font-bold uppercase tracking-wider text-white">Contact Information</h2>
                <p className="text-xs text-zinc-400">Used for courier delivery notifications and order receipts</p>
              </div>

              {message && (
                <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-700 pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Email Address (Primary)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2.5 text-xs text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Email address cannot be changed directly for account security.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-700 pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#b8e600] disabled:opacity-50 mt-4"
                >
                  {saving ? "Saving Changes..." : "Save Profile"}
                </button>
              </form>
            </div>

            <div className="bg-[#121214] border border-zinc-800 p-6">
              <div className="mb-4 pb-4 border-b border-zinc-800">
                <h2 className="text-base font-bold uppercase tracking-wider text-white">Password &amp; Security</h2>
                <p className="text-xs text-zinc-400">Update your password to keep your member account safe</p>
              </div>

              <button
                type="button"
                onClick={() => alert("Password reset link has been dispatched to your verified email.")}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-zinc-700"
              >
                <Lock className="w-3.5 h-3.5 text-[#ccff00]" />
                <span>Send Password Reset Link</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
