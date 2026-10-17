"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. If Supabase is connected, authenticate via Supabase Auth
      if (isSupabaseConfigured()) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          throw new Error(authError.message);
        }

        // Verify role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user?.id)
          .eq("role", "admin")
          .single();

        if (roleError || !roleData) {
          await supabase.auth.signOut();
          throw new Error("Access denied. Your account does not have authorized admin privileges.");
        }
      } else {
        // Local preview fallback passkey for Phase 1 verification
        if (password !== "flashwear2026" && password !== "admin123") {
          throw new Error("Invalid admin passphrase. (Default local preview pass: flashwear2026)");
        }
      }

      localStorage.setItem("flashwear_admin_auth", "true");
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111113] border border-zinc-800 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#ccff00]/10 border border-[#ccff00] text-[#ccff00] flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#ccff00] font-bold">
            RESTRICTED ACCESS
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            FLASHWEAR Staff Portal
          </h1>
          <p className="text-xs text-zinc-400">
            Authorized administrator credentials required to manage inventory, catalog, and orders.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-xs font-mono text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">
              Admin Email / Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@flashwear.store"
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">
              Password / Passkey
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-zinc-800 text-black font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all mt-6 shadow-md"
          >
            {loading ? "Authenticating..." : "Enter Command Center"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-800/80 text-center">
          <Link
            href="/"
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase"
          >
            ← Return to Public Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
