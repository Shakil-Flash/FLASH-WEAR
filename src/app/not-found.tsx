import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-[#F7F5F0] min-h-[75vh] flex items-center justify-center py-20 px-4 text-center">
      <div className="max-w-md w-full bg-white border border-[#E7E3DC] rounded-xl p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-6xl sm:text-7xl font-extrabold text-[#FF5938] tracking-tighter">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#181818]">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#74716D] leading-relaxed max-w-sm mx-auto">
            The piece, collection, or page you are looking for has been archived, moved, or does not exist.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] font-medium text-xs rounded-lg transition-colors"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
