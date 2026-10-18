import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="bg-[#F7F5F0] border-b border-[#E7E3DC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Editorial Headline & Actions (7 columns) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E7E3DC] rounded-full text-[11px] font-semibold text-[#74716D] uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#FF5938]" />
              <span>Autumn / Winter • Drop 01</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#181818] leading-[1.08]">
              Your everyday, <br className="hidden sm:inline" />
              turned up.
            </h1>

            <p className="max-w-lg text-sm sm:text-base lg:text-lg text-[#74716D] leading-relaxed">
              Easy pieces. Big mood. Find your next favorite fit with heavyweight cotton essentials crafted for everyday living.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-[0.99]"
              >
                <span>Shop the latest</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/categories/hoodies-sweats"
                className="inline-flex items-center gap-1.5 px-5 py-3.5 bg-white hover:bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] text-xs sm:text-sm font-medium rounded-lg transition-colors"
              >
                <span>Explore essentials</span>
              </Link>
            </div>

            {/* Natural reassurance line */}
            <div className="pt-4 border-t border-[#E7E3DC] flex flex-wrap items-center gap-5 sm:gap-6 text-xs text-[#74716D]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#181818]" />
                <span>Cash on Delivery across all 64 districts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#181818]" />
                <span>7-day easy size exchange</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Campaign Visual (5 columns) */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[#E7E3DC] bg-[#F2EFEB] shadow-sm group">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
                alt="FLASHWEAR Autumn Winter Streetwear Campaign"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-102"
              />
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-md border border-[#E7E3DC] text-[11px] font-semibold text-[#181818] shadow-xs">
                Drop 01 // Everyday Essentials
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
