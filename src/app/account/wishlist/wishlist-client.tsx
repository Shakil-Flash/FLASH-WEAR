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
    <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b border-[#E7E3DC]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Saved Items ({wishlist.length})</h2>
        <p className="text-xs text-[#74716D] mt-0.5">Keep track of your favorite styles before they sell out</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 text-[#74716D]">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-40 text-[#181818]" />
          <p className="text-sm font-medium text-[#181818]">Your wishlist is currently empty.</p>
          <Link
            href="/shop"
            className="inline-block mt-4 px-5 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
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
                className="bg-white border border-[#E7E3DC] rounded-xl p-4 flex flex-col justify-between group hover:border-[#D1CCC2] transition-colors"
              >
                <div>
                  <div className="relative aspect-square mb-3 bg-[#F7F5F0] rounded-lg overflow-hidden border border-[#E7E3DC]">
                    {p.images?.[0]?.url ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#74716D] text-xs">No Image</div>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-[#181818] line-clamp-1">{p.name}</h3>
                  <div className="text-xs font-bold text-[#FF5938] mt-1">
                    {formatBDT(p.price)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E7E3DC] flex items-center justify-between">
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="text-[#74716D] hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <Link
                    href={`/product/${p.slug}`}
                    className="px-3 py-1.5 bg-[#181818] hover:bg-[#2e2e2e] text-white text-[11px] font-medium rounded-md flex items-center gap-1 transition-colors"
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
