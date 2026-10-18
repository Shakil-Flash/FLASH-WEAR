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
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            Personal Details
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">
            Profile &amp; Security
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <main className="flex-1 w-full space-y-6">
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-[#E7E3DC]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Contact Information</h2>
                <p className="text-xs text-[#74716D] mt-0.5">Used for delivery notifications and order receipts</p>
              </div>

              {message && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium text-[#74716D] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#74716D] mb-1.5">
                    Email Address (Primary)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-[#F7F5F0]/60 border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#74716D] cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[11px] text-[#74716D] mt-1 block">Email address cannot be changed directly for account security.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#74716D] mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-medium rounded-lg disabled:opacity-50 mt-4 transition-colors shadow-sm"
                >
                  {saving ? "Saving Changes..." : "Save Profile"}
                </button>
              </form>
            </div>

            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <div className="mb-4 pb-4 border-b border-[#E7E3DC]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Password &amp; Security</h2>
                <p className="text-xs text-[#74716D] mt-0.5">Update your password to keep your member account safe</p>
              </div>

              <button
                type="button"
                onClick={() => alert("Password reset link has been dispatched to your verified email.")}
                className="px-4 py-2 bg-white hover:bg-[#F7F5F0] text-[#181818] text-xs font-medium rounded-lg flex items-center gap-2 border border-[#E7E3DC] transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-[#FF5938]" />
                <span>Send Password Reset Link</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
