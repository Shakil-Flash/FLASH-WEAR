"use client";

import { useState } from "react";
import Link from "next/link";
import { WishlistItem } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { Heart, Trash2, ArrowRight } from "lucide-react";

interface Props {
  initialWishlist: WishlistItem[];
}

export function WishlistClient({ initialWishlist }: Props) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(initialWishlist);

  const handleRemove = async (productId: string) => {
    try {
      await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr-demo", productId }),
      });
      setWishlist(wishlist.filter((w) => w.product_id !== productId));
    } catch (err) {
      console.error("Wishlist remove error:", err);
    }
  };

  return (
    <div className="bg-[#121214] border border-zinc-800 p-6">
      <div className="mb-6 pb-4 border-b border-zinc-800">
        <h2 className="text-base font-bold uppercase tracking-wider text-white">Saved Wishlist ({wishlist.length})</h2>
        <p className="text-xs text-zinc-400">Save items you want to keep an eye on before the drop sells out</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-40 text-zinc-600" />
          <p className="text-sm">Your wishlist is currently empty.</p>
          <Link
            href="/shop"
            className="inline-block mt-4 px-4 py-2 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#b8e600]"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((item) => {
            const p = item.product;
            if (!p) return null;
            return (
              <div
                key={item.id}
                className="bg-[#161619] border border-zinc-800 p-4 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="relative aspect-square mb-3 bg-zinc-900 overflow-hidden">
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">No Image</div>
                    )}
                  </div>
                  <h3 className="text-xs font-bold uppercase text-white line-clamp-1">{p.name}</h3>
                  <div className="text-xs font-mono text-[#ccff00] font-bold mt-1">
                    {formatBDT(p.price)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="text-zinc-500 hover:text-red-400 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <Link
                    href={`/product/${p.slug}`}
                    className="px-3 py-1.5 bg-[#ccff00] hover:bg-[#b8e600] text-black text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
