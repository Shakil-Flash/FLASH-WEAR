"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    setTimeout(() => {
      setLoading(false);
      setMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/account");
      }, 500);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-[#E7E3DC] rounded-xl p-8 sm:p-10 shadow-sm">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#FF5938] mb-1">
            Join FLASHWEAR
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#181818]">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-[#74716D] mt-1.5">
            Enjoy order tracking, saved addresses, and express checkout.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Tanzim Shakil"
                className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@example.com"
                className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-1.5">
              Phone Number (Bangladesh)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01712345678"
                className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50 shadow-sm"
          >
            {loading ? "Creating..." : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E7E3DC] text-center text-xs text-[#74716D]">
          Already have an account?{" "}
          <Link href="/account/login" className="text-[#FF5938] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
