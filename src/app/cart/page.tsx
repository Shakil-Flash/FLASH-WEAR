"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatBDT, calculateDeliveryFee } from "@/lib/utils/format-currency";
import { trackViewCart } from "@/lib/analytics/ga4";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, Tag, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const FREE_SHIPPING_THRESHOLD = 3000;

function CartContent() {
  const searchParams = useSearchParams();
  const { items, removeItem, updateQuantity, subtotal, totalQuantity, replaceCart } = useCart();
  const [selectedDivision, setSelectedDivision] = useState<"Dhaka" | "Outside Dhaka">("Dhaka");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  const deliveryFee = calculateDeliveryFee(selectedDivision);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount + (items.length > 0 ? deliveryFee : 0));

  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // Abandoned cart recovery from email link
  useEffect(() => {
    const recoverToken = searchParams?.get("recover");
    if (recoverToken) {
      fetch(`/api/cart/recover?token=${encodeURIComponent(recoverToken)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.cart?.items) {
            replaceCart(data.cart.items);
            setRecoveryNotice("Your saved cart has been recovered with current real-time prices & inventory!");
          }
        })
        .catch((e) => console.error("Recovery failed:", e));
    }
  }, [searchParams, replaceCart]);

  // Track View Cart
  useEffect(() => {
    if (items.length > 0) {
      trackViewCart(items, subtotal);
    }
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          message: data.message,
        });
      } else {
        setCouponError(data.message || "Invalid coupon code");
      }
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

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

        {recoveryNotice && (
          <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold">Cart Recovered</p>
              <p>{recoveryNotice}</p>
            </div>
          </div>
        )}

        {/* Free Nationwide Shipping Progress Bar */}
        <div className="mt-6 p-4 bg-[#111113] border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-zinc-300">
              <Truck className="w-4 h-4 text-[#ccff00]" />
              {amountToFreeShipping === 0 ? (
                <span className="text-[#ccff00] font-bold">🎉 Congratulations! You unlocked FREE Nationwide Delivery!</span>
              ) : (
                <span>Add <strong className="text-white font-bold">{formatBDT(amountToFreeShipping)}</strong> more to your bag for FREE Delivery!</span>
              )}
            </span>
            <span className="text-zinc-500 font-bold">{shippingProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-[#ccff00] transition-all duration-300"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
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
                <div className="col-span-2 sm:text-center font-mono text-xs text-zinc-300">
                  <span className="sm:hidden text-zinc-500">Unit: </span>
                  {formatBDT(item.unitPrice)}
                </div>

                {/* Quantity Controls */}
                <div className="col-span-2 flex sm:justify-center items-center gap-2">
                  <div className="flex items-center border border-zinc-800 bg-zinc-900">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 font-mono text-xs font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxInventory}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors"
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
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-[#111113] border border-zinc-800 sticky top-28 space-y-6">
              <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-3">
                Order Summary
              </h2>

              {/* Coupon Box */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Promotional Coupon
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="FLASH10, WELCOME200"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#18181b] border border-zinc-700 pl-8 pr-2 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold uppercase text-white transition-colors"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <strong>{appliedCoupon.code} applied!</strong>
                    </span>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs border-t border-zinc-800 pt-3">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">{formatBDT(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="font-mono">-{formatBDT(discountAmount)}</span>
                  </div>
                )}

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
                  href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`}
                  className="w-full h-12 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="p-3 bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
                  <Truck className="w-4 h-4 text-[#ccff00] flex-shrink-0 mt-0.5" />
                  <span>
                    Cash on Delivery & Online SSLCOMMERZ Payments available across all 64 districts.
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

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#0a0a0b] min-h-screen py-24 text-center text-zinc-400 font-mono text-xs flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
            <span>LOADING SHOPPING BAG...</span>
          </div>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
