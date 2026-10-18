"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatBDT, calculateDeliveryFee } from "@/lib/utils/format-currency";
import { trackViewCart } from "@/lib/analytics/ga4";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, Tag, CheckCircle2, AlertCircle } from "lucide-react";

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
            setRecoveryNotice("Your saved bag has been restored with current inventory!");
          }
        })
        .catch((e) => console.error("Recovery failed:", e));
    }
  }, [searchParams, replaceCart]);

  // Track View Cart once per items load
  const hasTrackedCartRef = React.useRef(false);
  useEffect(() => {
    if (items.length > 0 && !hasTrackedCartRef.current) {
      hasTrackedCartRef.current = true;
      trackViewCart(items, subtotal);
    }
  }, [items, subtotal]);

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
      <div className="bg-[#F7F5F0] min-h-[75vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white border border-[#E7E3DC] rounded-xl p-8 sm:p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#F7F5F0] border border-[#E7E3DC] flex items-center justify-center mx-auto mb-6 text-[#74716D]">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#181818] mb-2">
            Your shopping bag is empty
          </h1>
          <p className="text-sm text-[#74716D] mb-8 leading-relaxed">
            You haven't added any pieces yet. Explore our latest arrivals, heavyweight hoodies, relaxed tees, and cargo pants.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            <span>Explore collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F5F0] min-h-screen py-10 sm:py-14 text-[#181818]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="pb-6 border-b border-[#E7E3DC]">
          <div className="flex items-center gap-2 text-xs text-[#74716D] mb-2">
            <Link href="/" className="hover:text-[#181818] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#181818] font-medium">Shopping Bag</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">
              Shopping Bag
            </h1>
            <span className="text-sm text-[#74716D]">
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"} selected
            </span>
          </div>
        </div>

        {recoveryNotice && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Bag Recovered</p>
              <p className="text-xs text-emerald-700">{recoveryNotice}</p>
            </div>
          </div>
        )}

        {/* Free Nationwide Shipping Progress Bar */}
        <div className="mt-6 p-4 sm:p-5 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center gap-2 text-[#181818]">
              <Truck className="w-4 h-4 text-[#FF5938] shrink-0" />
              {amountToFreeShipping === 0 ? (
                <span className="text-[#181818] font-semibold">
                  You qualify for <span className="text-[#FF5938]">Free Nationwide Delivery</span>!
                </span>
              ) : (
                <span>
                  Add <strong className="font-semibold text-[#181818]">{formatBDT(amountToFreeShipping)}</strong> more to unlock Free Delivery
                </span>
              )}
            </span>
            <span className="text-xs font-semibold text-[#74716D]">{shippingProgress}%</span>
          </div>
          <div className="w-full h-2 bg-[#F7F5F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF5938] rounded-full transition-all duration-300"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-3">
            <div className="hidden sm:grid grid-cols-12 text-xs uppercase tracking-wider text-[#74716D] font-medium pb-2 px-4">
              <span className="col-span-6">Product</span>
              <span className="col-span-2 text-center">Unit Price</span>
              <span className="col-span-2 text-center">Quantity</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {items.map((item) => (
              <div
                key={item.variantId}
                className="p-4 sm:p-5 bg-white border border-[#E7E3DC] rounded-xl shadow-sm transition-all hover:border-[#D1CCC2]"
              >
                <div className="sm:grid sm:grid-cols-12 sm:items-center gap-4">
                  {/* Product Info */}
                  <div className="col-span-6 flex items-start sm:items-center gap-3.5 sm:gap-4">
                    <div className="w-20 h-24 sm:w-20 sm:h-24 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] flex-shrink-0 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="text-sm font-semibold text-[#181818] hover:text-[#FF5938] transition-colors line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#74716D]">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F7F5F0] border border-[#E7E3DC] text-[#181818] font-medium text-[11px]">
                          {item.size}
                        </span>
                        <span>•</span>
                        <span>{item.color}</span>
                      </div>
                      <p className="text-[11px] text-[#74716D] mt-1 font-mono">SKU: {item.sku}</p>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="mt-2 text-xs text-[#74716D] hover:text-red-600 flex items-center gap-1 transition-colors group"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#74716D] group-hover:text-red-600" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Row for Price & Quantity / Desktop columns */}
                  <div className="mt-4 pt-3 border-t border-[#F2EFEB] sm:mt-0 sm:pt-0 sm:border-0 sm:col-span-6 grid grid-cols-3 sm:grid-cols-6 items-center gap-2">
                    {/* Unit Price */}
                    <div className="sm:col-span-2 text-left sm:text-center text-xs sm:text-sm font-medium text-[#181818]">
                      <span className="block text-[10px] sm:hidden text-[#74716D] uppercase">Unit</span>
                      {formatBDT(item.unitPrice)}
                    </div>

                    {/* Quantity Controls */}
                    <div className="sm:col-span-2 flex justify-center items-center">
                      <div className="flex items-center border border-[#E7E3DC] rounded-lg bg-[#F7F5F0] overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#74716D] hover:text-[#181818] hover:bg-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-[#181818]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxInventory}
                          className="w-8 h-8 flex items-center justify-center text-[#74716D] hover:text-[#181818] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 text-right text-xs sm:text-sm font-bold text-[#181818]">
                      <span className="block text-[10px] sm:hidden text-[#74716D] uppercase">Total</span>
                      {formatBDT(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm sticky top-24 space-y-5">
              <h2 className="text-base font-bold text-[#181818] border-b border-[#E7E3DC] pb-3">
                Order Summary
              </h2>

              {/* Coupon Box */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#74716D]">
                  Promotional code
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#74716D]" />
                    <input
                      type="text"
                      placeholder="FLASH10, WELCOME200"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-8 pr-2 py-2 text-xs font-medium uppercase text-[#181818] focus:outline-none focus:border-[#FF5938] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-[#181818] hover:bg-[#2e2e2e] disabled:opacity-40 text-xs font-semibold text-white rounded-lg transition-colors"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{appliedCoupon.code} applied</span>
                    </span>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-[#74716D] hover:text-[#181818] font-bold text-sm leading-none"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm border-t border-[#E7E3DC] pt-4">
                <div className="flex justify-between text-[#74716D]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#181818]">{formatBDT(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatBDT(discountAmount)}</span>
                  </div>
                )}

                {/* Delivery Selector Preview */}
                <div className="space-y-2 pt-2 border-t border-[#E7E3DC]">
                  <div className="flex justify-between items-center text-xs text-[#74716D]">
                    <span>Estimated Shipping</span>
                    <span className="font-medium text-[#181818]">{formatBDT(deliveryFee)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDivision("Dhaka")}
                      className={`py-2 px-2.5 text-xs rounded-lg border text-center transition-all ${
                        selectedDivision === "Dhaka"
                          ? "border-[#FF5938] bg-[#FFF5F3] text-[#FF5938] font-semibold shadow-xs"
                          : "border-[#E7E3DC] text-[#74716D] hover:border-[#181818]"
                      }`}
                    >
                      Inside Dhaka (৳80)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDivision("Outside Dhaka")}
                      className={`py-2 px-2.5 text-xs rounded-lg border text-center transition-all ${
                        selectedDivision === "Outside Dhaka"
                          ? "border-[#FF5938] bg-[#FFF5F3] text-[#FF5938] font-semibold shadow-xs"
                          : "border-[#E7E3DC] text-[#74716D] hover:border-[#181818]"
                      }`}
                    >
                      Outside Dhaka (৳150)
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E7E3DC] flex justify-between items-baseline font-bold">
                  <span className="text-sm text-[#181818]">Estimated Total</span>
                  <span className="text-xl text-[#FF5938]">{formatBDT(total)}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ""}`}
                  className="w-full h-12 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] text-xs text-[#74716D] flex items-start gap-2.5 leading-relaxed">
                  <Truck className="w-4 h-4 text-[#FF5938] flex-shrink-0 mt-0.5" />
                  <span>
                    Cash on Delivery & online payment available across all 64 districts in Bangladesh.
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
        <div className="bg-[#F7F5F0] min-h-screen py-24 text-center text-[#74716D] text-sm flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 border-2 border-[#FF5938] border-t-transparent rounded-full animate-spin" />
            <span>Loading bag...</span>
          </div>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
