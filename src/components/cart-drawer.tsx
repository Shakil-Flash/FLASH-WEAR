"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatBDT } from "@/lib/utils/format-currency";

const FREE_SHIPPING_THRESHOLD = 3000;

export function CartDrawer() {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen, subtotal, totalQuantity } =
    useCart();

  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181818]/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#F7F5F0] border-l border-[#E7E3DC] h-full flex flex-col justify-between z-10 shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E7E3DC] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#FF5938]" />
            <h2 className="font-display text-base font-bold tracking-tight text-[#181818]">
              Your Bag ({totalQuantity})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-[#74716D] hover:text-[#181818] rounded-md transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-white border border-[#E7E3DC] flex items-center justify-center mb-4 text-[#74716D] shadow-sm">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-display text-base font-bold text-[#181818] mb-1">
                Your bag is empty
              </h3>
              <p className="text-xs text-[#74716D] max-w-xs mb-6 leading-relaxed">
                Explore our everyday streetwear pieces, heavyweight hoodies, and relaxed fits.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
              >
                Start Exploring
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Free Delivery Goal Bar */}
              <div className="p-3 bg-white border border-[#E7E3DC] rounded-md space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#181818] font-medium">
                    <Truck className="w-3.5 h-3.5 text-[#FF5938]" />
                    {amountToFreeShipping === 0 ? (
                      <span className="text-[#FF5938] font-bold">Free Nationwide Delivery Unlocked!</span>
                    ) : (
                      <span>Add <strong className="text-[#181818]">{formatBDT(amountToFreeShipping)}</strong> for Free Delivery</span>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-[#74716D]">{shippingProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F2EFEB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF5938] transition-all duration-300"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3.5 p-3.5 bg-white border border-[#E7E3DC] rounded-lg shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 bg-[#F2EFEB] rounded-md overflow-hidden flex-shrink-0 border border-[#E7E3DC]/60">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80"}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`/product/${item.productSlug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs font-semibold text-[#181818] hover:text-[#FF5938] transition-colors line-clamp-1 leading-snug"
                        >
                          {item.productName}
                        </Link>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-[#74716D] hover:text-red-500 p-1.5 -mr-1 -mt-1 rounded-md hover:bg-[#F7F5F0] transition-colors"
                          title="Remove item"
                          aria-label={`Remove ${item.productName} from bag`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#74716D]">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] font-medium">
                          {item.size}
                        </span>
                        <span>•</span>
                        <span>{item.color}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F7F5F0]">
                      {/* Quantity selector with generous touch targets */}
                      <div className="flex items-center border border-[#E7E3DC] bg-[#F7F5F0] rounded-md">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#74716D] hover:text-[#181818] hover:bg-white rounded-l transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-[#181818]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxInventory}
                          className="w-7 h-7 flex items-center justify-center text-[#74716D] hover:text-[#181818] hover:bg-white rounded-r disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total */}
                      <span className="text-xs font-bold text-[#181818]">
                        {formatBDT(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with subtotal and checkout */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-[#E7E3DC] bg-white space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#74716D]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#181818]">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#74716D]">
                <span>Estimated Delivery</span>
                <span className="text-[#181818]">From ৳80 (Dhaka)</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#181818] pt-2 border-t border-[#E7E3DC]">
                <span>Total</span>
                <span className="text-base text-[#181818]">{formatBDT(subtotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full h-11 bg-[#FF5938] hover:bg-[#E64525] text-white font-semibold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="w-full h-10 bg-transparent hover:bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] font-medium text-xs rounded-md flex items-center justify-center transition-colors"
              >
                View Full Bag
              </Link>
            </div>

            <p className="text-[11px] text-center text-[#74716D]">
              Cash on Delivery available nationwide in Bangladesh
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
