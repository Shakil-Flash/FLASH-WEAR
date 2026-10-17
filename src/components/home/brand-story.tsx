import React from "react";
import Link from "next/link";
import { ArrowRight, Layers, ShieldCheck, Flame } from "lucide-react";

export function BrandStory() {
  return (
    <section className="py-24 bg-[#080809] border-b border-zinc-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Editorial Visual Column */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] overflow-hidden border border-zinc-800 bg-zinc-900">
              <img
                src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85"
                alt="FLASHWEAR Dhaka Streetwear Studio"
                className="w-full h-full object-cover filter contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Overlay Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/85 backdrop-blur-md border border-zinc-700/80">
                <p className="font-mono text-xs uppercase tracking-widest text-[#ccff00] font-bold">
                  BRED IN DHAKA // 23°48'N 90°24'E
                </p>
                <p className="text-xs text-zinc-300 mt-1">
                  Engineered with custom milled heavyweight textiles for high humidity and all-day wear.
                </p>
              </div>
            </div>

            {/* Decorative Streetwear Tape */}
            <div className="hidden sm:block absolute -top-4 -right-4 bg-[#ccff00] text-black font-mono font-black text-xs px-3 py-1 uppercase tracking-widest rotate-3 shadow-lg">
              AUTHENTIC FLASH SPEC
            </div>
          </div>

          {/* Story Content Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block font-mono text-[11px] uppercase tracking-widest text-[#ccff00]">
              The FLASHWEAR Manifesto
            </div>

            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              NO FAST FASHION. <br />
              JUST UNFORGIVING SILHOUETTES.
            </h2>

            <p className="text-sm text-zinc-400 leading-relaxed">
              FLASHWEAR was born from a frustration with flimsy apparel and cookie-cutter designs. We engineer contemporary streetwear rooted in raw architectural lines, heavyweight French terry, and boxy oversized drapes tailored specifically for South Asian street culture.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/80">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <Layers className="w-4 h-4 text-[#ccff00]" />
                  <span>480 GSM French Terry</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Custom knitted high-density cotton that holds its architectural drop through hundreds of wears.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 text-[#ccff00]" />
                  <span>Tactical Hardware</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Cordura nylon, YKK reverse coil zippers, and bar-tack reinforced stress points.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#ccff00] hover:text-white transition-colors"
              >
                <span>Read Full Brand Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
