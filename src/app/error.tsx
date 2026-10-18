"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Redacted error logging on client
    console.error("Application error boundary triggered:", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-[70vh] bg-[#0a0a0b] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-8 rounded-lg shadow-2xl space-y-6">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            SYSTEM EXCEPTION
          </p>
          <h1 className="text-xl font-bold uppercase tracking-tight text-white">
            Something Went Wrong
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            An unexpected error occurred while processing this request. Our technical team has been notified.
          </p>
        </div>

        {/* Display technical digest or dev details safely without exposing server internals */}
        {error.digest && (
          <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80 font-mono text-[11px] text-zinc-400">
            Error Reference: <span className="text-zinc-200">{error.digest}</span>
          </div>
        )}

        {isDev && error.message && (
          <div className="text-left bg-red-950/20 border border-red-900/40 p-3 rounded text-[11px] font-mono text-red-300 break-words">
            <p className="font-bold text-red-200 mb-1">Developer Debug Info:</p>
            {error.message}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#ccff00] text-black font-semibold text-xs uppercase tracking-wider rounded hover:bg-[#b8e600] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs uppercase tracking-wider rounded hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
