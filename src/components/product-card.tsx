"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const images = product.images || [];
  const primaryImage = images[0]?.url || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80";
  const secondaryImage = images[1]?.url || primaryImage;

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  // Extract unique sizes and colors
  const sizes = Array.from(new Set(product.variants?.map((v) => v.size) || []));
  const colors = Array.from(new Set(product.variants?.map((v) => v.color) || []));
  const totalStock = product.variants?.reduce((acc, v) => acc + v.inventory_quantity, 0) ?? 0;

  return (
    <div
      className="group relative flex flex-col bg-[#111113] border border-zinc-800/80 transition-all duration-300 hover:border-zinc-700 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Badges */}
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950 block">
        <img
          src={isHovered ? secondaryImage : primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_featured && <Badge variant="lime">Featured Drop</Badge>}
          {product.is_bestseller && <Badge variant="dark">Bestseller</Badge>}
          {hasDiscount && (
            <Badge variant="destructive">
              SAVE {discountPercent}%
            </Badge>
          )}
          {totalStock === 0 && (
            <Badge variant="neutral">SOLD OUT</Badge>
          )}
        </div>

        {/* Quick Sizes Preview On Hover */}
        {sizes.length > 0 && (
          <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-sm py-2 px-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between text-[11px] font-mono text-zinc-300">
            <span>SIZES:</span>
            <div className="flex gap-1.5">
              {sizes.map((s) => (
                <span key={s} className="px-1.5 py-0.5 bg-zinc-800 text-white rounded-none">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Color Count */}
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-zinc-500 mb-1">
            <span>{product.category?.name || "Apparel"}</span>
            {colors.length > 1 && <span>{colors.length} Colors</span>}
          </div>

          {/* Product Name */}
          <Link
            href={`/product/${product.slug}`}
            className="text-sm font-medium uppercase tracking-tight text-white hover:text-[#ccff00] transition-colors line-clamp-1"
          >
            {product.name}
          </Link>
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-white group-hover:text-[#ccff00] transition-colors">
              {formatBDT(product.price)}
            </span>
            {hasDiscount && (
              <span className="font-mono text-xs text-zinc-500 line-through">
                {formatBDT(product.compare_at_price)}
              </span>
            )}
          </div>

          <Link
            href={`/product/${product.slug}`}
            className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 group-hover:text-[#ccff00] flex items-center gap-1 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
