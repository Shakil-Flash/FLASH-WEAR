import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Shirt, Truck } from "lucide-react";

export const metadata = {
  title: "About Us | FLASHWEAR",
  description: "Learn about FLASHWEAR's approach to everyday streetwear, relaxed silhouettes, and quality essentials.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#F7F5F0] min-h-screen py-16 sm:py-20 text-[#181818]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Title */}
        <div className="border-b border-[#E7E3DC] pb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#FF5938]">
            Brand Story
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#181818] mt-2">
            Your Everyday, Turned Up.
          </h1>
          <p className="text-xs text-[#74716D] mt-2">
            Independent Streetwear &bull; Est. 2026 &bull; Dhaka, Bangladesh
          </p>
        </div>

        {/* Narrative */}
        <div className="space-y-6 text-base text-[#181818] leading-relaxed">
          <p className="text-lg text-[#181818] font-medium leading-relaxed">
            FLASHWEAR was born from a simple desire: clothes that feel good, fit right, and look effortless from morning to midnight.
          </p>
          <p className="text-[#74716D]">
            Based in Dhaka, we build contemporary streetwear rooted in relaxed silhouettes, heavyweight custom cottons, and versatile everyday pieces. We design garments that elevate your day without overcomplicating it — boxy tees that hold their shape, fleece hoodies that feel like a second home, and cargos ready for the street.
          </p>
          <p className="text-[#74716D]">
            We care deeply about quality, proportions, and authentic details. No shortcuts, no disposable garments, and no unnecessary gimmicks. Just honest fits crafted with personality and care.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#E7E3DC]">
          <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-3">
            <Shirt className="w-6 h-6 text-[#FF5938]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Quality Textiles</h3>
            <p className="text-xs text-[#74716D] leading-relaxed">
              Custom-density combed cottons and heavyweight terry that keep their shape wear after wear.
            </p>
          </div>
          <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-3">
            <Sparkles className="w-6 h-6 text-[#FF5938]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Relaxed Proportions</h3>
            <p className="text-xs text-[#74716D] leading-relaxed">
              Thoughtfully calibrated drop shoulders, comfortable cuts, and effortless everyday versatility.
            </p>
          </div>
          <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-3">
            <Truck className="w-6 h-6 text-[#FF5938]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Nationwide Access</h3>
            <p className="text-xs text-[#74716D] leading-relaxed">
              Fast, reliable delivery with Cash on Delivery and online payment across all 64 districts.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8 border-t border-[#E7E3DC] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="text-xs font-medium text-[#74716D]">Find your next favorite fit today.</span>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
          >
            <span>Shop The Latest</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
