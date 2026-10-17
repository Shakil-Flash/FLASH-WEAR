"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBDT, calculateDeliveryFee } from "@/lib/utils/format-currency";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, totalQuantity } = useCart();
  const [selectedDivision, setSelectedDivision] = useState<"Dhaka" | "Outside Dhaka">("Dhaka");

  const deliveryFee = calculateDeliveryFee(selectedDivision);
  const total = subtotal + (items.length > 0 ? deliveryFee : 0);

  if (items.length === 0) {
    return (
      <div className="bg-[#0a0a0b] min-h-[75vh] flex items-center justify-center py-16 text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6 text-zinc-500">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Your Bag is Empty
          </h1>
          <p className="text-xs text-zinc-400 mb-8 leading-relaxed">
            You haven't added any streetwear items to your cart yet. Explore the latest Drop 01 heavyweight hoodies, tees, and cargos.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#ccff00] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#b8e600] transition-colors"
          >
            <span>Explore The Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b] min-h-screen py-12 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-[#ccff00]">Shopping Bag</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            Shopping Bag ({totalQuantity} Item{totalQuantity === 1 ? "" : "s"})
          </h1>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Items Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="hidden sm:grid grid-cols-12 text-xs font-mono uppercase text-zinc-500 pb-3 border-b border-zinc-800">
              <span className="col-span-6">Product</span>
              <span className="col-span-2 text-center">Unit Price</span>
              <span className="col-span-2 text-center">Quantity</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {items.map((item) => (
              <div
                key={item.variantId}
                className="p-4 bg-[#111113] border border-zinc-800/80 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-4"
              >
                {/* Product Info */}
                <div className="col-span-6 flex items-center gap-4">
                  <div className="w-20 h-24 bg-zinc-950 border border-zinc-800 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="text-xs sm:text-sm font-semibold uppercase text-white hover:text-[#ccff00] transition-colors line-clamp-1"
                    >
                      {item.productName}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span>Size: <strong className="text-white">{item.size}</strong></span>
                      <span>•</span>
                      <span>Color: <strong className="text-white">{item.color}</strong></span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="mt-2 text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Unit Price */}
                <div className="col-span-2 sm:text-center text-xs font-mono text-zinc-300">
                  <span className="sm:hidden text-zinc-500">Unit: </span>
                  {formatBDT(item.unitPrice)}
                </div>

                {/* Quantity Controls */}
                <div className="col-span-2 flex sm:justify-center">
                  <div className="flex items-center border border-zinc-800 bg-zinc-900">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-2 text-zinc-400 hover:text-white"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-xs font-mono font-medium text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxInventory}
                      className="p-2 text-zinc-400 hover:text-white disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="col-span-2 sm:text-right font-mono text-xs font-bold text-[#ccff00]">
                  <span className="sm:hidden text-zinc-500 font-normal">Line Total: </span>
                  {formatBDT(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="p-6 bg-[#111113] border border-zinc-800 sticky top-28 space-y-6">
              <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">{formatBDT(subtotal)}</span>
                </div>

                {/* Delivery Selector Preview */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Delivery Location</span>
                    <span className="font-mono text-white">{formatBDT(deliveryFee)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedDivision("Dhaka")}
                      className={`py-2 px-3 text-xs font-mono uppercase border text-center transition-all ${
                        selectedDivision === "Dhaka"
                          ? "border-[#ccff00] bg-zinc-900 text-white font-bold"
                          : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      Inside Dhaka (৳80)
                    </button>
                    <button
                      onClick={() => setSelectedDivision("Outside Dhaka")}
                      className={`py-2 px-3 text-xs font-mono uppercase border text-center transition-all ${
                        selectedDivision === "Outside Dhaka"
                          ? "border-[#ccff00] bg-zinc-900 text-white font-bold"
                          : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      Outside Dhaka (৳150)
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline font-bold">
                  <span className="text-sm uppercase tracking-wider text-white">Estimated Total</span>
                  <span className="font-mono text-lg text-[#ccff00]">{formatBDT(total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/checkout"
                  className="w-full h-12 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="p-3 bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
                  <Truck className="w-4 h-4 text-[#ccff00] flex-shrink-0 mt-0.5" />
                  <span>
                    Cash on Delivery (COD) payment will be collected at your address upon delivery.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
