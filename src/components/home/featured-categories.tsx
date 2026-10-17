import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Category } from "@/lib/types";

interface FeaturedCategoriesProps {
  categories: Category[];
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  return (
    <section className="py-20 bg-[#0a0a0b] border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ccff00]">
              Silhouettes & Wardrobe
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
              Shop By Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="mt-4 md:mt-0 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-[#ccff00] flex items-center gap-1 group"
          >
            <span>View Full Catalog</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 4).map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-zinc-900 border border-zinc-800"
            >
              <img
                src={category.image_url || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"}
                alt={category.name}
                className="w-full h-full object-cover object-center filter grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Number tag */}
              <div className="absolute top-4 left-4 font-mono text-xs text-[#ccff00]">
                0{index + 1}
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-6 inset-x-6 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight text-white group-hover:text-[#ccff00] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1">
                    {category.description}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-black/60 border border-zinc-700 flex items-center justify-center text-white group-hover:bg-[#ccff00] group-hover:text-black group-hover:border-[#ccff00] transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
