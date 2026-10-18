"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatBDT, calculateDeliveryFee } from "@/lib/utils/format-currency";
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  Lock,
  CreditCard,
  Banknote,
  Tag,
  Award,
  Users,
  Sparkles,
} from "lucide-react";
import { trackBeginCheckout, trackApplyCoupon } from "@/lib/analytics/ga4";

const BD_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart, replaceCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    division: "Dhaka",
    district: "",
    deliveryAddress: "",
    orderNotes: "",
    paymentMethod: "cash_on_delivery" as "cash_on_delivery" | "sslcommerz",
    agreedToTerms: false,
  });

  // Track begin checkout
  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(items, subtotal);
    }
  }, []);

  // Recover abandoned cart from resume link
  useEffect(() => {
    const recoverToken = searchParams?.get("recover");
    if (recoverToken) {
      fetch(`/api/cart/recover?token=${encodeURIComponent(recoverToken)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.cart?.items) {
            replaceCart(data.cart.items);
            if (data.cart.email) {
              setFormData((prev) => ({
                ...prev,
                customerEmail: data.cart.email || prev.customerEmail,
                customerName: data.cart.customerName || prev.customerName,
                customerPhone: data.cart.phone || prev.customerPhone,
              }));
            }
          }
        })
        .catch((err) => console.error("Abandoned cart recovery failed:", err));
    }
  }, [searchParams, replaceCart]);

  // Debounced abandoned cart tracking
  useEffect(() => {
    if ((!formData.customerEmail && !formData.customerPhone) || items.length === 0) return;
    const timer = setTimeout(() => {
      fetch("/api/cart/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.customerEmail || undefined,
          phone: formData.customerPhone || undefined,
          customerName: formData.customerName || undefined,
          items: items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            productName: i.productName,
            productSlug: i.productSlug,
            size: i.size,
            color: i.color,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            imageUrl: i.imageUrl,
          })),
          subtotal,
        }),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData.customerEmail, formData.customerPhone, formData.customerName, items, subtotal]);

  // Coupon State
  const [couponCode, setCouponCode] = useState(searchParams?.get("coupon") || "");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Loyalty Points State
  const [loyaltyData, setLoyaltyData] = useState<{
    availablePoints: number;
    settings: {
      is_active: boolean;
      points_per_100_bdt: number;
      point_value_bdt: number;
      min_redemption_points: number;
      max_redemption_points: number;
      can_combine_with_coupon: boolean;
    };
  } | null>(null);
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState<number>(0);
  const [appliedPoints, setAppliedPoints] = useState<number>(0);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/rewards")
      .then((res) => res.json())
      .then((data) => {
        if (data.availablePoints !== undefined) {
          setLoyaltyData({
            availablePoints: data.availablePoints,
            settings: data.settings,
          });
          if (data.availablePoints >= (data.settings?.min_redemption_points || 100)) {
            setPointsToRedeemInput(
              Math.min(data.availablePoints, data.settings?.max_redemption_points || 1000)
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleApplyLoyaltyPoints = () => {
    setLoyaltyError(null);
    if (!loyaltyData || !loyaltyData.settings?.is_active) {
      setLoyaltyError("Loyalty program is currently inactive.");
      return;
    }
    if (appliedCoupon && !loyaltyData.settings.can_combine_with_coupon) {
      setLoyaltyError("Loyalty points cannot be combined with a coupon code on this order.");
      return;
    }
    if (pointsToRedeemInput < (loyaltyData.settings.min_redemption_points || 100)) {
      setLoyaltyError(`Minimum ${loyaltyData.settings.min_redemption_points} points required to redeem.`);
      return;
    }
    if (pointsToRedeemInput > (loyaltyData.settings.max_redemption_points || 1000)) {
      setLoyaltyError(`Maximum ${loyaltyData.settings.max_redemption_points} points can be redeemed per order.`);
      return;
    }
    if (pointsToRedeemInput > loyaltyData.availablePoints) {
      setLoyaltyError(`You only have ${loyaltyData.availablePoints} points available.`);
      return;
    }
    setAppliedPoints(pointsToRedeemInput);
  };

  // Referral Code State
  const [referralCodeInput, setReferralCodeInput] = useState(
    searchParams?.get("ref") || searchParams?.get("referral") || ""
  );
  const [appliedReferral, setAppliedReferral] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

  const handleValidateReferral = useCallback(async (codeToValidate: string) => {
    if (!codeToValidate.trim()) return;
    setReferralLoading(true);
    setReferralError(null);
    try {
      const res = await fetch("/api/account/referrals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToValidate.trim().toUpperCase(),
          email: formData.customerEmail || undefined,
          phone: formData.customerPhone || undefined,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedReferral({
          code: data.code,
          discountAmount: data.discountAmount,
          message: data.message,
        });
      } else {
        setReferralError(data.message || "Invalid referral code");
      }
    } catch {
      setReferralError("Failed to validate referral code");
    } finally {
      setReferralLoading(false);
    }
  }, [formData.customerEmail, formData.customerPhone]);

  useEffect(() => {
    const refQuery = searchParams?.get("ref") || searchParams?.get("referral");
    if (refQuery && !appliedReferral) {
      handleValidateReferral(refQuery);
    }
  }, [searchParams, appliedReferral, handleValidateReferral]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(
    searchParams?.get("payment_error") || ""
  );

  const [idempotencyKey] = useState(
    () => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  const deliveryFee = calculateDeliveryFee(formData.division);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const loyaltyPointValue = loyaltyData?.settings?.point_value_bdt || 1.0;
  const loyaltyDiscount = appliedPoints > 0 ? Number((appliedPoints * loyaltyPointValue).toFixed(2)) : 0;
  const referralDiscount = appliedReferral ? appliedReferral.discountAmount : 0;
  const totalDiscounts = Math.min(subtotal, couponDiscount + loyaltyDiscount + referralDiscount);
  const totalAmount = Math.max(0, subtotal - totalDiscounts + (items.length > 0 ? deliveryFee : 0));

  const handleValidateCoupon = useCallback(async (codeToValidate: string) => {
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToValidate.trim(), subtotal, email: formData.customerEmail }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          message: data.message,
        });
        trackApplyCoupon(data.code, data.discountAmount);
        if (loyaltyData?.settings && !loyaltyData.settings.can_combine_with_coupon) {
          setAppliedPoints(0);
        }
      } else {
        setCouponError(data.message || "Invalid coupon code");
      }
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  }, [subtotal, formData.customerEmail, loyaltyData]);

  useEffect(() => {
    const code = searchParams?.get("coupon");
    if (code && subtotal > 0 && !appliedCoupon) {
      handleValidateCoupon(code);
    }
  }, [subtotal, searchParams, appliedCoupon, handleValidateCoupon]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      errs.customerName = "Full name must be at least 2 characters.";
    }

    const bdPhoneRegex = /^(?:\+?8801|01)[3-9]\d{8}$/;
    if (!formData.customerPhone.trim() || !bdPhoneRegex.test(formData.customerPhone.trim())) {
      errs.customerPhone = "Enter a valid Bangladesh phone number (e.g. 01712345678).";
    }

    if (formData.customerEmail && !formData.customerEmail.includes("@")) {
      errs.customerEmail = "Please enter a valid email address.";
    }

    if (!formData.division) {
      errs.division = "Please select your division.";
    }

    if (!formData.district.trim() || formData.district.trim().length < 2) {
      errs.district = "Please specify your district or city (e.g. Dhaka, Chattogram, Sylhet).";
    }

    if (!formData.deliveryAddress.trim() || formData.deliveryAddress.trim().length < 10) {
      errs.deliveryAddress =
        "Please provide your complete address (House, Road, Area, Ward/Thana).";
    }

    if (!formData.agreedToTerms) {
      errs.agreedToTerms = "Please confirm the order agreement before proceeding.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError("");

    if (items.length === 0) {
      setSubmissionError("Your shopping bag is empty. Please add items before checking out.");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: "usr-demo",
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail ? formData.customerEmail.trim() : undefined,
        division: formData.division,
        district: formData.district.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        orderNotes: formData.orderNotes ? formData.orderNotes.trim() : undefined,
        paymentMethod: formData.paymentMethod,
        couponCode: appliedCoupon?.code,
        loyaltyPointsToRedeem: appliedPoints > 0 ? appliedPoints : undefined,
        referralCode: appliedReferral?.code,
        idempotencyKey,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process your order.");
      }

      if (formData.paymentMethod === "sslcommerz") {
        const initRes = await fetch("/api/payments/sslcommerz/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
          }),
        });

        const initData = await initRes.json();
        if (initRes.ok && initData.redirectUrl) {
          clearCart();
          window.location.href = initData.redirectUrl;
          return;
        } else {
          throw new Error(initData.error || "Payment gateway connection failed.");
        }
      }

      clearCart();
      router.push(`/order-confirmation/${data.orderNumber}?token=${data.receiptToken}`);
    } catch (err: any) {
      setSubmissionError(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
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
            No items to checkout
          </h1>
          <p className="text-sm text-[#74716D] mb-8 leading-relaxed">
            Please add items from the collection to your shopping bag before continuing to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-[#FF5938] hover:bg-[#E64525] text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            <span>Return to shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F5F0] min-h-screen py-10 sm:py-14 text-[#181818]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Header */}
        <div className="pb-6 border-b border-[#E7E3DC]">
          <div className="flex items-center gap-2 text-xs text-[#74716D] mb-2">
            <Link href="/" className="hover:text-[#181818] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-[#181818] transition-colors">Bag</Link>
            <span>/</span>
            <span className="text-[#181818] font-medium">Checkout</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">
              Checkout
            </h1>
            <span className="text-xs sm:text-sm text-[#74716D] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted 256-bit secure transaction</span>
            </span>
          </div>
        </div>

        {submissionError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="text-xs text-red-600">{submissionError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Customer & Shipping Inputs (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Details */}
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#181818] uppercase tracking-wider border-b border-[#E7E3DC] pb-3">
                1. Customer &amp; Contact
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#181818]">
                    Full Name <span className="text-[#FF5938]">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Tanzim Shakil"
                    className={`w-full bg-[#F7F5F0] border rounded-lg px-3.5 py-2.5 text-sm text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all ${
                      errors.customerName ? "border-red-500 bg-red-50/20" : "border-[#E7E3DC]"
                    }`}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.customerName}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#181818]">
                    Phone Number <span className="text-[#FF5938]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="01712345678"
                    className={`w-full bg-[#F7F5F0] border rounded-lg px-3.5 py-2.5 text-sm text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all ${
                      errors.customerPhone ? "border-red-500 bg-red-50/20" : "border-[#E7E3DC]"
                    }`}
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.customerPhone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#181818]">
                  Email Address <span className="text-[#74716D] font-normal">(for digital invoice &amp; parcel tracking)</span>
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={`w-full bg-[#F7F5F0] border rounded-lg px-3.5 py-2.5 text-sm text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all ${
                    errors.customerEmail ? "border-red-500 bg-red-50/20" : "border-[#E7E3DC]"
                  }`}
                />
                {errors.customerEmail && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.customerEmail}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#181818] uppercase tracking-wider border-b border-[#E7E3DC] pb-3">
                2. Shipping Address (Bangladesh)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#181818]">
                    Division <span className="text-[#FF5938]">*</span>
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg px-3 py-2.5 text-sm text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all cursor-pointer"
                  >
                    {BD_DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {div} {div === "Dhaka" ? "— Inside Dhaka (৳80)" : "— Outside Dhaka (৳150)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#181818]">
                    District / City <span className="text-[#FF5938]">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Dhaka, Chattogram, Sylhet"
                    className={`w-full bg-[#F7F5F0] border rounded-lg px-3.5 py-2.5 text-sm text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all ${
                      errors.district ? "border-red-500 bg-red-50/20" : "border-[#E7E3DC]"
                    }`}
                  />
                  {errors.district && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.district}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#181818]">
                  Street Address &amp; Landmarks <span className="text-[#FF5938]">*</span>
                </label>
                <textarea
                  name="deliveryAddress"
                  rows={3}
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  placeholder="House number, road number, apartment/flat, landmark, police station (Thana)..."
                  className={`w-full bg-[#F7F5F0] border rounded-lg px-3.5 py-2.5 text-sm text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all ${
                    errors.deliveryAddress ? "border-red-500 bg-red-50/20" : "border-[#E7E3DC]"
                  }`}
                />
                {errors.deliveryAddress && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.deliveryAddress}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#181818]">
                  Delivery Instructions <span className="text-[#74716D] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="orderNotes"
                  value={formData.orderNotes}
                  onChange={handleChange}
                  placeholder="e.g. deliver after 4 PM, call before arriving"
                  className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg px-3.5 py-2.5 text-sm text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#181818] uppercase tracking-wider border-b border-[#E7E3DC] pb-3">
                3. Payment Method
              </h2>

              <div className="space-y-3">
                {/* Cash on Delivery Option */}
                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${
                    formData.paymentMethod === "cash_on_delivery"
                      ? "border-[#FF5938] bg-[#FFF5F3] ring-1 ring-[#FF5938]/20"
                      : "border-[#E7E3DC] bg-white hover:border-[#181818]/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={formData.paymentMethod === "cash_on_delivery"}
                    onChange={() => setFormData({ ...formData, paymentMethod: "cash_on_delivery" })}
                    className="accent-[#FF5938] mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-[#FF5938]" />
                        <h4 className="text-sm font-bold text-[#181818]">
                          Cash on Delivery (COD)
                        </h4>
                      </div>
                      <span className="text-[10px] bg-stone-100 text-[#181818] font-semibold px-2 py-0.5 rounded-full border border-stone-200">
                        Pay at doorstep
                      </span>
                    </div>
                    <p className="text-xs text-[#74716D] mt-1.5 leading-relaxed">
                      Pay in cash upon parcel handover anywhere in {formData.district || formData.division || "Bangladesh"}. Please keep exact cash ready.
                    </p>
                  </div>
                </label>

                {/* Online Payment Option */}
                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${
                    formData.paymentMethod === "sslcommerz"
                      ? "border-[#FF5938] bg-[#FFF5F3] ring-1 ring-[#FF5938]/20"
                      : "border-[#E7E3DC] bg-white hover:border-[#181818]/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="sslcommerz"
                    checked={formData.paymentMethod === "sslcommerz"}
                    onChange={() => setFormData({ ...formData, paymentMethod: "sslcommerz" })}
                    className="accent-[#FF5938] mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#FF5938]" />
                        <h4 className="text-sm font-bold text-[#181818]">
                          Online Payment (Instant Confirmation)
                        </h4>
                      </div>
                      <span className="text-[10px] bg-[#F4D66D] text-[#181818] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        bKash • Nagad • Cards
                      </span>
                    </div>
                    <p className="text-xs text-[#74716D] mt-1.5 leading-relaxed">
                      Instant secure checkout via SSLCOMMERZ gateway: bKash, Nagad, Rocket, Visa, Mastercard, AMEX, and Bangladeshi internet banking.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-[#F2EFEB]">
                <label className="flex items-start gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 accent-[#FF5938] rounded shrink-0"
                  />
                  <span className="text-xs text-[#74716D] leading-relaxed">
                    I acknowledge that I am placing an authentic order with FLASHWEAR for{" "}
                    <strong className="text-[#181818] font-semibold">{formatBDT(totalAmount)}</strong> and accept the return and shipping terms.
                  </span>
                </label>
                {errors.agreedToTerms && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.agreedToTerms}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Column (Right Column) */}
          <div className="lg:col-span-5">
            <div className="p-6 bg-white border border-[#E7E3DC] rounded-xl shadow-sm sticky top-24 space-y-5">
              <h2 className="text-sm font-bold text-[#181818] uppercase tracking-wider border-b border-[#E7E3DC] pb-3">
                Order Review ({items.length} {items.length === 1 ? "Item" : "Items"})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-center gap-3 py-2 border-b border-[#E7E3DC]/60 last:border-b-0"
                  >
                    <div className="w-12 h-14 bg-[#F7F5F0] rounded-md border border-[#E7E3DC] flex-shrink-0 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#181818] truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-[#74716D]">
                        {item.size} • {item.color} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold text-[#181818]">
                      {formatBDT(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box in Checkout */}
              <div className="space-y-2 pt-2 border-t border-[#E7E3DC]">
                <label className="block text-xs font-semibold text-[#181818]">
                  Have a coupon code?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#74716D]" />
                    <input
                      type="text"
                      placeholder="FLASH10, WELCOME200"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-8 pr-2 py-2 text-xs font-semibold uppercase text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleValidateCoupon(couponCode)}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-[#181818] hover:bg-[#2e2e2e] disabled:opacity-40 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{appliedCoupon.code} applied</span>
                    </span>
                    <button
                      type="button"
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

              {/* Loyalty Rewards Redemption Box */}
              {loyaltyData?.settings?.is_active && (
                <div className="space-y-2 pt-2 border-t border-[#E7E3DC]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#181818] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#FF5938]" />
                      <span>Loyalty Points</span>
                    </label>
                    <span className="text-xs font-bold text-[#FF5938]">
                      {loyaltyData.availablePoints} pts available
                    </span>
                  </div>

                  {appliedPoints > 0 ? (
                    <div className="p-2.5 bg-orange-50 border border-[#FF5938]/30 text-[#FF5938] text-xs rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{appliedPoints} pts applied (-{formatBDT(loyaltyDiscount)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedPoints(0)}
                        className="text-[#74716D] hover:text-[#181818] font-bold text-sm leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={loyaltyData.settings.min_redemption_points || 100}
                          max={Math.min(loyaltyData.availablePoints, loyaltyData.settings.max_redemption_points || 1000)}
                          value={pointsToRedeemInput || ""}
                          onChange={(e) => setPointsToRedeemInput(parseInt(e.target.value) || 0)}
                          placeholder={`Min ${loyaltyData.settings.min_redemption_points || 100} pts`}
                          className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs text-[#181818] focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleApplyLoyaltyPoints}
                          disabled={
                            loyaltyData.availablePoints < (loyaltyData.settings.min_redemption_points || 100) ||
                            (appliedCoupon !== null && !loyaltyData.settings.can_combine_with_coupon)
                          }
                          className="px-4 py-2 bg-[#181818] hover:bg-[#2e2e2e] disabled:opacity-40 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Redeem
                        </button>
                      </div>
                      {appliedCoupon && !loyaltyData.settings.can_combine_with_coupon && (
                        <p className="text-[11px] text-[#74716D]">
                          Note: Points cannot be combined with a coupon code.
                        </p>
                      )}
                    </div>
                  )}

                  {loyaltyError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                      <span>{loyaltyError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Referral Code Box */}
              <div className="space-y-2 pt-2 border-t border-[#E7E3DC]">
                <label className="block text-xs font-semibold text-[#181818] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#FF5938]" />
                  <span>Friend Referral Code</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. FLASH-94287"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg px-3 py-2 text-xs uppercase font-medium text-[#181818] placeholder-[#74716D]/60 focus:outline-none focus:border-[#FF5938] focus:ring-2 focus:ring-[#FF5938]/15 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleValidateReferral(referralCodeInput)}
                    disabled={referralLoading || !referralCodeInput.trim()}
                    className="px-4 py-2 bg-[#181818] hover:bg-[#2e2e2e] disabled:opacity-40 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {referralLoading ? "..." : "Claim"}
                  </button>
                </div>

                {appliedReferral && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{appliedReferral.message}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedReferral(null)}
                      className="text-[#74716D] hover:text-[#181818] font-bold text-sm leading-none"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {referralError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{referralError}</span>
                  </div>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 text-xs pt-3 border-t border-[#E7E3DC]">
                <div className="flex justify-between text-[#74716D]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#181818]">{formatBDT(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-{formatBDT(couponDiscount)}</span>
                  </div>
                )}

                {appliedPoints > 0 && (
                  <div className="flex justify-between text-[#FF5938] font-medium">
                    <span>Loyalty Points ({appliedPoints} pts)</span>
                    <span>-{formatBDT(loyaltyDiscount)}</span>
                  </div>
                )}

                {appliedReferral && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Referral Discount ({appliedReferral.code})</span>
                    <span>-{formatBDT(referralDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#74716D]">
                  <span>
                    Delivery ({formData.division === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"})
                  </span>
                  <span className="font-medium text-[#181818]">{formatBDT(deliveryFee)}</span>
                </div>

                <div className="pt-3 border-t border-[#E7E3DC] flex justify-between items-baseline">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#181818]">Total to Pay</span>
                    <span className="text-[11px] text-[#74716D]">VAT &amp; Courier included</span>
                  </div>
                  <span className="text-2xl font-extrabold text-[#181818] tracking-tight">
                    {formatBDT(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#FF5938] hover:bg-[#E64525] disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>
                      {formData.paymentMethod === "sslcommerz"
                        ? "Connecting to gateway..."
                        : "Placing order..."}
                    </span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {formData.paymentMethod === "sslcommerz"
                        ? `Pay with SSLCOMMERZ — ${formatBDT(totalAmount)}`
                        : `Place Order (COD) — ${formatBDT(totalAmount)}`}
                    </span>
                  </>
                )}
              </button>

              <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E7E3DC] text-[11px] text-[#74716D] space-y-1">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure checkout with instant order confirmation</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#FF5938]" />
                  <span>Doorstep delivery via Pathao &amp; Steadfast Courier</span>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#F7F5F0] min-h-screen py-24 text-center text-[#74716D] text-sm flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#FF5938] border-t-transparent rounded-full animate-spin" />
            <span>Loading checkout...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
