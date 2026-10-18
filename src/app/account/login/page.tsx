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

    // Simulate fast authenticated session
    setTimeout(() => {
      setLoading(false);
      setMessage("Authenticated successfully. Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/account");
      }, 600);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-32 pb-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#121214] border border-zinc-800 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-[#ccff00] font-mono mb-2">
            {"// MEMBER ACCESS"}
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Customer Login
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            Log in to manage your orders, delivery addresses, and returns.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-[#18181b] border border-zinc-700 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ccff00]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert("Password reset instructions sent to your email.")}
                className="text-[11px] text-zinc-500 hover:text-[#ccff00]"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#18181b] border border-zinc-700 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ccff00]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#ccff00] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#b8e600] transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-400">
          Don't have an account yet?{" "}
          <Link href="/account/register" className="text-[#ccff00] font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
