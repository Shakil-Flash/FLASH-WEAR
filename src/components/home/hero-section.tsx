import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="bg-[#F7F5F0] border-b border-[#E7E3DC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Editorial Headline & Actions (7 columns) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E7E3DC] rounded-full text-[11px] font-semibold text-[#74716D] uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FF5938]" />
              <span>Autumn / Winter • Drop 01</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#181818] leading-[1.05]">
              Your everyday, <br className="hidden sm:inline" />
              turned up.
            </h1>

            <p className="max-w-lg text-base sm:text-lg text-[#74716D] leading-relaxed">
              Easy pieces. Big mood. Find your next favorite fit with heavyweight cotton essentials crafted for everyday living.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
              >
                <span>Shop the latest</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/categories/hoodies-sweats"
                className="text-sm font-semibold text-[#181818] hover:text-[#FF5938] underline underline-offset-4 decoration-[#E7E3DC] hover:decoration-[#FF5938] transition-colors"
              >
                Explore essentials
              </Link>
            </div>

            {/* Natural reassurance line */}
            <div className="pt-6 border-t border-[#E7E3DC]/80 flex flex-wrap items-center gap-6 text-xs text-[#74716D]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#181818]" />
                <span>Cash on Delivery across Bangladesh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#181818]" />
                <span>7-day easy size exchange</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Campaign Visual (5 columns) */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-[#E7E3DC] bg-[#F2EFEB] shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
                alt="FLASHWEAR Autumn Winter Streetwear Campaign"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded text-[11px] font-medium text-[#181818] shadow-sm">
                Drop 01 // Streetwear Essentials
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
