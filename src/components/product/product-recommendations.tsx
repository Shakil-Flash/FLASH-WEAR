"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { Sparkles, ArrowRight, Eye } from "lucide-react";
import { useCart } from "@/lib/cart-context";

interface Props {
  title?: string;
  subtitle?: string;
  products: Product[];
}

export function ProductRecommendations({
  title = "You May Also Like",
  subtitle = "Curated streetwear pieces based on current browsing",
  products,
}: Props) {
  const { addItem } = useCart();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-zinc-800/80">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-8">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#ccff00] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXPLAINABLE RECOMMENDATIONS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <span>Explore All Drops</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => {
          const mainImage = product.images?.[0]?.url || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800";
          const firstVariant = product.variants?.[0];
          const isOutOfStock = product.variants?.every((v) => v.inventory_quantity <= 0);

          return (
            <div
              key={product.id}
              className="group bg-[#121214] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between overflow-hidden"
            >
              <Link href={`/product/${product.slug}`} className="block relative aspect-square bg-zinc-900 overflow-hidden">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.is_bestseller && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 border border-zinc-700 text-[#ccff00] text-[9px] font-mono uppercase font-bold tracking-wider">
                    Bestseller
                  </span>
                )}
                {isOutOfStock && (
                  <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Out of Stock
                  </span>
                )}
              </Link>

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                    {product.category?.name || "Apparel"}
                  </span>
                  <Link
                    href={`/product/${product.slug}`}
                    className="text-xs font-bold uppercase text-white hover:text-[#ccff00] transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-white">
                    {formatBDT(product.price)}
                  </span>

                  {firstVariant && !isOutOfStock ? (
                    <button
                      onClick={() =>
                        addItem({
                          variantId: firstVariant.id,
                          productId: product.id,
                          productName: product.name,
                          productSlug: product.slug,
                          size: firstVariant.size,
                          color: firstVariant.color,
                          sku: firstVariant.sku,
                          unitPrice: product.price,
                          quantity: 1,
                          maxInventory: firstVariant.inventory_quantity,
                          imageUrl: mainImage,
                        })
                      }
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-[#ccff00] hover:text-black text-white text-[10px] uppercase font-bold tracking-wider transition-colors"
                    >
                      + Add
                    </button>
                  ) : (
                    <Link
                      href={`/product/${product.slug}`}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
