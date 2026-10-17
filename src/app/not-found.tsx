import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-[#0a0a0b] min-h-[75vh] flex items-center justify-center py-20 px-4 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="font-mono text-7xl font-black text-[#ccff00] tracking-tighter">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Lost In The Underground
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            The page, collection, or product you are looking for has been moved, unlisted, or does not exist.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 bg-[#ccff00] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#b8e600] transition-colors"
          >
            Explore Catalog
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-medium uppercase text-xs tracking-wider transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
