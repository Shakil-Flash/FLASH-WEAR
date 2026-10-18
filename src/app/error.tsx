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
    console.error("Application error boundary triggered:", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-[70vh] bg-[#F7F5F0] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md w-full bg-white border border-[#E7E3DC] p-8 sm:p-10 rounded-xl shadow-sm space-y-6">
        <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#74716D]">
            System Notice
          </p>
          <h1 className="text-xl font-bold tracking-tight text-[#181818]">
            Something Went Wrong
          </h1>
          <p className="text-xs sm:text-sm text-[#74716D] leading-relaxed">
            An unexpected error occurred while loading this page. Please try refreshing or return home.
          </p>
        </div>

        {error.digest && (
          <div className="bg-[#F7F5F0] p-2.5 rounded-lg border border-[#E7E3DC] text-xs text-[#74716D]">
            Reference: <span className="text-[#181818] font-medium">{error.digest}</span>
          </div>
        )}

        {isDev && error.message && (
          <div className="text-left bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-700 break-words">
            <p className="font-semibold text-red-800 mb-1">Developer Debug Info:</p>
            {error.message}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] font-medium text-xs rounded-lg transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
