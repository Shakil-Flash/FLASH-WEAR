"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  product: Product;
}

// Color dot mapping helper for streetwear palette
const COLOR_MAP: Record<string, string> = {
  black: "#181818",
  "obsidian black": "#181818",
  "matte black": "#222222",
  "pitch black": "#121212",
  "washed black": "#2c2c2e",
  white: "#FFFFFF",
  "chalk white": "#F5F5F3",
  "raw ecru": "#ECE7DC",
  gray: "#7D7A75",
  "concrete gray": "#8E8B85",
  "slate gray": "#64696D",
  olive: "#555A46",
  "olive drab": "#4E543D",
  sand: "#CBBFA8",
  navy: "#1C2536",
  charcoal: "#363839",
};

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const images = product.images || [];
  const primaryImage =
    images[0]?.url ||
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80";
  const secondaryImage = images[1]?.url || primaryImage;

  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price);
  const totalStock = product.variants?.reduce((acc, v) => acc + v.inventory_quantity, 0) ?? 0;
  const isSoldOut = totalStock === 0;

  // Extract unique colors & sizes
  const colors = Array.from(new Set(product.variants?.map((v) => v.color).filter(Boolean) || []));
  const sizes = Array.from(new Set(product.variants?.map((v) => v.size).filter(Boolean) || []));

  return (
    <div
      className="group relative flex flex-col bg-white rounded-lg border border-[#E7E3DC] overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#D1CCC2]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#F2EFEB] block"
      >
        <img
          src={isHovered ? secondaryImage : primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Restrained Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {isSoldOut ? (
            <Badge variant="neutral">Sold out</Badge>
          ) : hasDiscount ? (
            <Badge variant="sale">Sale</Badge>
          ) : product.is_featured ? (
            <Badge variant="dark">New In</Badge>
          ) : null}
        </div>

        {/* Clean Subtle Sizes Pill Overlay On Desktop Hover */}
        {sizes.length > 0 && !isSoldOut && (
          <div className="absolute bottom-2.5 inset-x-2.5 hidden sm:flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white/95 backdrop-blur-xs rounded-md text-[11px] font-medium text-[#181818] opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xs">
            <span className="text-[#74716D] text-[10px] uppercase tracking-wider mr-1">Sizes:</span>
            {sizes.map((s) => (
              <span key={s} className="px-1 text-[#181818] font-bold">
                {s}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Product Details - Fixed Vertical Rhythm */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div className="space-y-1.5">
          {/* Category & Color Swatches */}
          <div className="flex items-center justify-between text-[11px] text-[#74716D]">
            <span className="font-medium truncate">{product.category?.name || "Streetwear"}</span>

            {/* Visual Color Dots */}
            {colors.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {colors.slice(0, 4).map((c) => {
                  const lower = c.toLowerCase();
                  const hex = COLOR_MAP[lower] || "#74716D";
                  return (
                    <span
                      key={c}
                      title={c}
                      className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
                {colors.length > 4 && (
                  <span className="text-[10px] text-[#74716D]">+{colors.length - 4}</span>
                )}
              </div>
            )}
          </div>

          {/* Product Title - Fixed 2-line height for perfect alignment */}
          <h3 className="text-xs sm:text-sm font-semibold text-[#181818] group-hover:text-[#FF5938] transition-colors line-clamp-2 leading-snug h-[2.5rem]">
            <Link href={`/product/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Pricing Footer */}
        <div className="mt-3 pt-2.5 border-t border-[#F2EFEB] flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-[#181818]">
              {formatBDT(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] sm:text-xs text-[#74716D] line-through">
                {formatBDT(product.compare_at_price)}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#74716D] group-hover:text-[#FF5938] transition-colors">
            View
          </span>
        </div>
      </div>
    </div>
  );
}
