import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BrandMoment() {
  return (
    <section className="py-20 sm:py-28 bg-[#F7F5F0] border-b border-[#E7E3DC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Authentic Campaign Photograph */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-[#F2EFEB] border border-[#E7E3DC] shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85"
                alt="FLASHWEAR Authentic Streetwear Lifestyle"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-md border border-[#E7E3DC] text-xs text-[#181818] flex items-center justify-between shadow-sm">
                <span className="font-semibold">Relaxed proportions. Real comfort.</span>
                <span className="text-[11px] text-[#74716D]">Dhaka Studio</span>
              </div>
            </div>
          </div>

          {/* Right Column: Confident, Relaxed Editorial Brand Copy */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
              The Philosophy
            </span>

            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#181818] leading-[1.1]">
              Made for your kind <br className="hidden sm:inline" />
              of everyday.
            </h2>

            <div className="space-y-4 text-base text-[#74716D] leading-relaxed">
              <p>
                We started FLASHWEAR with a simple perspective: clothes should look good, feel easy from the second you put them on, and stay in your rotation well past one season.
              </p>
              <p>
                No stiff unwearable concepts or disposable fast fashion. Just honest heavyweight cotton, drop-shoulder silhouettes, and practical details designed for real days and late nights.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#181818] hover:bg-[#FF5938] text-white text-xs font-semibold rounded-md transition-colors"
              >
                <span>Read our story</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/collections/drop-01-cyber-circuit"
                className="text-xs font-semibold text-[#181818] hover:text-[#FF5938] underline underline-offset-4 decoration-[#E7E3DC] hover:decoration-[#FF5938] transition-colors"
              >
                Explore Capsule
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
