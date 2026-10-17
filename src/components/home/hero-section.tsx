import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-zinc-800 bg-[#070708]">
      {/* Background Editorial Visual with Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=85"
          alt="FLASHWEAR Drop 01 Streetwear Campaign"
          className="w-full h-full object-cover object-center opacity-30 filter contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center flex flex-col items-center">
        {/* Drop Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/90 border border-zinc-700/80 mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-300">
            AUTUMN / WINTER 2026 // DROP 01 LIVE
          </span>
        </div>

        {/* Fashion Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter text-white max-w-5xl leading-[0.95] mb-6">
          ENGINEERED <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
            STREETWEAR
          </span>{" "}
          <span className="text-[#ccff00] drop-shadow-[0_0_25px_rgba(204,255,0,0.4)]">
            FOR URBAN CHAOS.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl text-sm sm:text-base text-zinc-400 font-normal leading-relaxed mb-10">
          Heavyweight 480 GSM French terry hoodies, oversized 240 GSM drop tees, and articulated tactical cargos. Designed for Dhaka, ready for the world.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-4 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_-5px_rgba(204,255,0,0.4)]"
          >
            <span>Explore The Drop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/collections/drop-01-cyber-circuit"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white font-medium uppercase text-xs tracking-widest flex items-center justify-center transition-all duration-200"
          >
            <span>Cyber Circuit Capsule</span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-16 pt-8 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-zinc-500 font-mono text-xs uppercase">
          <div className="flex items-center gap-2">
            <span className="text-[#ccff00]">01.</span> Heavyweight Cotton
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#ccff00]">02.</span> Boxy Oversized Cut
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#ccff00]">03.</span> Cash on Delivery All BD
          </div>
        </div>
      </div>
    </section>
  );
}
