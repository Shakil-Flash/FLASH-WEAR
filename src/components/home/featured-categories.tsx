import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Category } from "@/lib/types";

interface FeaturedCategoriesProps {
  categories: Category[];
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const displayCategories = categories.slice(0, 4);

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-[#E7E3DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E7E3DC]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
              Wardrobe Essentials
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181818] mt-1">
              Shop by category
            </h2>
          </div>
          <Link
            href="/shop"
            className="mt-3 sm:mt-0 text-xs font-semibold text-[#181818] hover:text-[#FF5938] inline-flex items-center gap-1 transition-colors group"
          >
            <span>View all items</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Editorial Category Image Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#F2EFEB] border border-[#E7E3DC] block shadow-xs"
            >
              <img
                src={
                  cat.image_url ||
                  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"
                }
                alt={cat.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

              {/* Title & Arrow */}
              <div className="absolute bottom-3.5 inset-x-3.5 sm:bottom-4 sm:inset-x-4 flex items-end justify-between text-white">
                <div className="min-w-0 pr-2">
                  <h3 className="font-display text-sm sm:text-base font-bold tracking-tight leading-tight group-hover:text-[#F4D66D] transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-white/75 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:bg-[#FF5938] transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
