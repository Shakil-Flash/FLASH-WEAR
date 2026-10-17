"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatBDT } from "@/lib/utils/format-currency";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen, subtotal, totalQuantity } =
    useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#0e0e10] border-l border-zinc-800 h-full flex flex-col justify-between z-10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#ccff00]" />
            <h2 className="text-sm uppercase tracking-widest font-bold text-white">
              Your Bag ({totalQuantity})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-sm uppercase font-mono tracking-wider text-white mb-2">
                Your bag is empty
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mb-6">
                Explore the latest FLASHWEAR Drop 01 streetwear capsule and gear up.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 bg-[#ccff00] text-black text-xs font-semibold uppercase hover:bg-[#b8e600] transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 p-3 bg-[#141416] border border-zinc-800"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 bg-zinc-900 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80"}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/product/${item.productSlug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs uppercase font-medium text-white hover:text-[#ccff00] transition-colors line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-zinc-500 hover:text-red-400 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                        <span>Size: <strong className="text-white">{item.size}</strong></span>
                        <span>•</span>
                        <span>Color: <strong className="text-white">{item.color}</strong></span>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-zinc-700 bg-zinc-900">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:text-[#ccff00] text-zinc-300"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-medium text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxInventory}
                          className="p-1 hover:text-[#ccff00] text-zinc-300 disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-[#ccff00]">
                          {formatBDT(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with subtotal and checkout */}
        {items.length > 0 && (
          <div className="p-6 border-t border-zinc-800 bg-[#121214] space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-white">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Estimated Delivery</span>
                <span className="font-mono text-zinc-300">From ৳80 (Dhaka)</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
                <span>Estimated Total</span>
                <span className="font-mono text-[#ccff00] text-base">{formatBDT(subtotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full h-12 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="w-full h-10 bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white uppercase text-xs tracking-wider flex items-center justify-center transition-colors"
              >
                View Full Cart
              </Link>
            </div>

            <p className="text-[10px] text-center font-mono text-zinc-500">
              Cash on Delivery Available Across All 64 Districts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
