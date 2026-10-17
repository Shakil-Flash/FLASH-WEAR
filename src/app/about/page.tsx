import React from "react";
import Link from "next/link";
import { ArrowRight, Layers, Cpu, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About Us — The FLASHWEAR Ethos",
  description: "Learn about FLASHWEAR's architectural streetwear design, heavy fabrics, and Dhaka roots.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#0a0a0b] min-h-screen py-16 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Title */}
        <div className="border-b border-zinc-800 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ccff00]">
            Manifesto & Origins
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-2">
            The FLASHWEAR Blueprint
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-2">
            Est. 2026 // Dhaka, Bangladesh
          </p>
        </div>

        {/* Narrative */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          <p className="text-base text-zinc-200 font-medium">
            FLASHWEAR was founded with a singular conviction: streetwear should not be disposable, thin, or imported without consideration of local climate and street culture.
          </p>
          <p>
            Operating out of Dhaka, Bangladesh, we engineer garments built around high-density textiles, architectural boxy fits, and modular utility hardware. Every piece is developed from the yarn up — milled with custom weights from 240 GSM combed jersey to 480 GSM French terry cotton.
          </p>
          <p>
            We reject the endless cycle of generic fast-fashion replicas. Our design philosophy draws from brutalist concrete forms, cybernetic circuit diagrams, and tactical mobility necessities.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-800">
          <div className="p-6 bg-[#111113] border border-zinc-800 space-y-3">
            <Layers className="w-6 h-6 text-[#ccff00]" />
            <h3 className="text-sm font-bold uppercase font-mono text-white">Heavyweight Builds</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Custom dense knits that maintain structured posture and silhouette after hundreds of wears and washes.
            </p>
          </div>
          <div className="p-6 bg-[#111113] border border-zinc-800 space-y-3">
            <Cpu className="w-6 h-6 text-[#ccff00]" />
            <h3 className="text-sm font-bold uppercase font-mono text-white">Tactical Utility</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Articulated knee darts, reverse taped zippers, hidden pockets, and modular strap integration.
            </p>
          </div>
          <div className="p-6 bg-[#111113] border border-zinc-800 space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#ccff00]" />
            <h3 className="text-sm font-bold uppercase font-mono text-white">Direct-to-Street</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No retail middlemen markups. Fair pricing with Cash on Delivery nationwide across Bangladesh.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="pt-8 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-xs font-mono text-zinc-500">READY TO WEAR THE REVOLUTION?</span>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ccff00] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#b8e600]"
          >
            <span>Explore The Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
