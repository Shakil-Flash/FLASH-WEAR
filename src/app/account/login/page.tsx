"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    setTimeout(() => {
      setLoading(false);
      setMessage("Signed in successfully. Redirecting...");
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
            Member Access
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#181818]">
            Customer Login
          </h1>
          <p className="text-xs sm:text-sm text-[#74716D] mt-1.5">
            Access your orders, delivery addresses, and account details.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#74716D] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#74716D]">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert("Password reset instructions sent to your email.")}
                className="text-[11px] text-[#74716D] hover:text-[#181818]"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#74716D]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Authenticating..." : "Sign in to account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E7E3DC] text-center text-xs text-[#74716D]">
          Don't have an account yet?{" "}
          <Link href="/account/register" className="text-[#FF5938] font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
