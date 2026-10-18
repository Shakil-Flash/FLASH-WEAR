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
  MapPin,
  Award,
  Users,
  Gift,
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

  // Debounced abandoned cart tracking (auto-records cart when customer enters email/phone)
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

  // Auto-validate referral code if passed in query
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

  // Idempotency token to prevent duplicate double-clicks
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
        // If loyalty points were applied and combination is not allowed, clear loyalty points
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

  // Automatically validate coupon if passed in query
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
      errs.district = "Please specify your district or city (e.g. Dhaka, Chittagong, Sylhet).";
    }

    if (!formData.deliveryAddress.trim() || formData.deliveryAddress.trim().length < 10) {
      errs.deliveryAddress =
        "Please provide your complete address (House, Road, Area, Ward/Thana).";
    }

    if (!formData.agreedToTerms) {
      errs.agreedToTerms = "You must agree to the order terms to proceed.";
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

      // If Online Payment (SSLCOMMERZ) chosen, initiate payment gateway
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

      // Cash on Delivery success: Clear cart & redirect to confirmation
      clearCart();
      router.push(`/order-confirmation/${data.orderNumber}?token=${data.receiptToken}`);
    } catch (err: any) {
      setSubmissionError(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
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
            No Items To Checkout
          </h1>
          <p className="text-xs text-zinc-400 mb-8 leading-relaxed">
            Please add items from the catalog to your shopping bag before opening checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#ccff00] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#b8e600]"
          >
            <span>Return to Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b] min-h-screen py-12 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Header */}
        <div className="pb-8 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-white">Cart</Link>
            <span>/</span>
            <span className="text-[#ccff00]">Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            Secure Order Checkout
          </h1>
        </div>

        {submissionError && (
          <div className="mt-6 p-4 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-bold">Checkout Notice</p>
              <p>{submissionError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Customer & Shipping Inputs (Left Column) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Contact Details */}
            <div className="p-6 bg-[#111113] border border-zinc-800/90 space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-3">
                1. Customer &amp; Notification Contact
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono text-zinc-400">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Tanzim Shakil"
                    className={`w-full bg-[#18181b] border px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00] ${
                      errors.customerName ? "border-red-500" : "border-zinc-700"
                    }`}
                  />
                  {errors.customerName && (
                    <p className="text-[11px] text-red-400 font-mono">{errors.customerName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono text-zinc-400">
                    Phone (Courier Contact) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="01712345678"
                    className={`w-full bg-[#18181b] border px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00] ${
                      errors.customerPhone ? "border-red-500" : "border-zinc-700"
                    }`}
                  />
                  {errors.customerPhone && (
                    <p className="text-[11px] text-red-400 font-mono">{errors.customerPhone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono text-zinc-400">
                  Email Address <span className="text-zinc-500">(For order confirmation receipt)</span>
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={`w-full bg-[#18181b] border px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00] ${
                    errors.customerEmail ? "border-red-500" : "border-zinc-700"
                  }`}
                />
                {errors.customerEmail && (
                  <p className="text-[11px] text-red-400 font-mono">{errors.customerEmail}</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="p-6 bg-[#111113] border border-zinc-800/90 space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-3">
                2. Shipping Destination (Bangladesh)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono text-zinc-400">
                    Division <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
                  >
                    {BD_DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {div} {div === "Dhaka" ? "(Delivery ৳80)" : "(Delivery ৳150)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono text-zinc-400">
                    District / City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Dhaka, Chittagong, Sylhet"
                    className={`w-full bg-[#18181b] border px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00] ${
                      errors.district ? "border-red-500" : "border-zinc-700"
                    }`}
                  />
                  {errors.district && (
                    <p className="text-[11px] text-red-400 font-mono">{errors.district}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono text-zinc-400">
                  Full Street Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="deliveryAddress"
                  rows={3}
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  placeholder="House number, road number, apartment/flat, landmark, police station (Thana)..."
                  className={`w-full bg-[#18181b] border px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00] ${
                    errors.deliveryAddress ? "border-red-500" : "border-zinc-700"
                  }`}
                />
                {errors.deliveryAddress && (
                  <p className="text-[11px] text-red-400 font-mono">{errors.deliveryAddress}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono text-zinc-400">
                  Order Notes <span className="text-zinc-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="orderNotes"
                  value={formData.orderNotes}
                  onChange={handleChange}
                  placeholder="Special courier instructions (e.g., deliver after 4 PM, call on arrival)"
                  className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 bg-[#111113] border border-zinc-800/90 space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-3">
                3. Payment Method Selection
              </h2>

              <div className="space-y-3">
                {/* Cash on Delivery Option */}
                <label
                  className={`p-4 border-2 flex items-start gap-3.5 cursor-pointer transition-colors ${
                    formData.paymentMethod === "cash_on_delivery"
                      ? "border-[#ccff00] bg-zinc-950"
                      : "border-zinc-800 bg-[#161619] hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={formData.paymentMethod === "cash_on_delivery"}
                    onChange={() => setFormData({ ...formData, paymentMethod: "cash_on_delivery" })}
                    className="accent-[#ccff00] mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#ccff00]" />
                      <h4 className="text-xs uppercase font-mono font-bold text-white">
                        Cash on Delivery (COD)
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Pay in cash upon doorstep delivery to your location in {formData.district || formData.division}.
                    </p>
                  </div>
                </label>

                {/* Online Payment Option */}
                <label
                  className={`p-4 border-2 flex items-start gap-3.5 cursor-pointer transition-colors ${
                    formData.paymentMethod === "sslcommerz"
                      ? "border-[#ccff00] bg-zinc-950"
                      : "border-zinc-800 bg-[#161619] hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="sslcommerz"
                    checked={formData.paymentMethod === "sslcommerz"}
                    onChange={() => setFormData({ ...formData, paymentMethod: "sslcommerz" })}
                    className="accent-[#ccff00] mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#ccff00]" />
                      <h4 className="text-xs uppercase font-mono font-bold text-white">
                        Online Payment (SSLCOMMERZ Hosted)
                      </h4>
                      <span className="text-[10px] bg-[#ccff00] text-black font-bold px-1.5 py-0.2 rounded font-mono">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Pay instantly via bKash, Nagad, Rocket, Visa, Mastercard, AMEX, or Bangladeshi Internet Banking.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 accent-[#ccff00]"
                  />
                  <span className="text-xs text-zinc-400 leading-relaxed">
                    I acknowledge that I am placing a genuine order with FLASHWEAR for{" "}
                    <strong className="text-white">{formatBDT(totalAmount)}</strong>.
                  </span>
                </label>
                {errors.agreedToTerms && (
                  <p className="text-[11px] text-red-400 font-mono mt-1">{errors.agreedToTerms}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Column (Right Column) */}
          <div className="lg:col-span-5">
            <div className="p-6 bg-[#111113] border border-zinc-800 sticky top-28 space-y-6">
              <h2 className="text-sm font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-3">
                Order Review ({items.length} Item{items.length === 1 ? "" : "s"})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-center gap-3 py-2 border-b border-zinc-800/60"
                  >
                    <div className="w-12 h-14 bg-zinc-950 border border-zinc-800 flex-shrink-0 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-medium text-white truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400">
                        {item.size} • {item.color} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right font-mono text-xs font-bold text-[#ccff00]">
                      {formatBDT(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box in Checkout */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Have a Coupon?
                </label>
                <div className="flex gap-2">
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
                    type="button"
                    onClick={() => handleValidateCoupon(couponCode)}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold uppercase text-white transition-colors"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <strong>{appliedCoupon.code} applied!</strong>
                    </span>
                    <button
                      type="button"
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

              {/* Loyalty Rewards Redemption Box */}
              {loyaltyData?.settings?.is_active && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#ccff00]" />
                      <span>Loyalty Points</span>
                    </label>
                    <span className="text-[11px] font-mono text-[#ccff00]">
                      {loyaltyData.availablePoints} pts available
                    </span>
                  </div>

                  {appliedPoints > 0 ? (
                    <div className="p-2 bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5" />
                        <strong>{appliedPoints} pts applied (-{formatBDT(loyaltyDiscount)})</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedPoints(0)}
                        className="text-zinc-400 hover:text-white"
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
                          className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#ccff00]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyLoyaltyPoints}
                          disabled={
                            loyaltyData.availablePoints < (loyaltyData.settings.min_redemption_points || 100) ||
                            (appliedCoupon !== null && !loyaltyData.settings.can_combine_with_coupon)
                          }
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold uppercase text-white transition-colors"
                        >
                          Redeem
                        </button>
                      </div>
                      {appliedCoupon && !loyaltyData.settings.can_combine_with_coupon && (
                        <p className="text-[10px] text-zinc-500 font-mono">
                          Note: Points cannot be combined with a coupon code.
                        </p>
                      )}
                    </div>
                  )}

                  {loyaltyError && (
                    <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{loyaltyError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Referral Code Box */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Friend Referral Code</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. FLASH-94287"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-[#ccff00]"
                  />
                  <button
                    type="button"
                    onClick={() => handleValidateReferral(referralCodeInput)}
                    disabled={referralLoading || !referralCodeInput.trim()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold uppercase text-white transition-colors"
                  >
                    {referralLoading ? "..." : "Claim"}
                  </button>
                </div>

                {appliedReferral && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <strong>{appliedReferral.message}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedReferral(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {referralError && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{referralError}</span>
                  </div>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-zinc-800">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">{formatBDT(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span className="font-mono">-{formatBDT(couponDiscount)}</span>
                  </div>
                )}

                {appliedPoints > 0 && (
                  <div className="flex justify-between text-[#ccff00] font-bold">
                    <span>Loyalty Points ({appliedPoints} pts)</span>
                    <span className="font-mono">-{formatBDT(loyaltyDiscount)}</span>
                  </div>
                )}

                {appliedReferral && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Referral Discount ({appliedReferral.code})</span>
                    <span className="font-mono">-{formatBDT(referralDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-400">
                  <span>
                    Delivery Fee ({formData.division === "Dhaka" ? "Dhaka City" : "Outside Dhaka"})
                  </span>
                  <span className="font-mono text-white">{formatBDT(deliveryFee)}</span>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline font-bold text-sm">
                  <span className="uppercase tracking-wider text-white">Total Amount</span>
                  <span className="font-mono text-xl text-[#ccff00]">
                    {formatBDT(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 font-mono">
                    <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                    {formData.paymentMethod === "sslcommerz"
                      ? "REDIRECTING TO SSLCOMMERZ..."
                      : "CONFIRMING ORDER..."}
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {formData.paymentMethod === "sslcommerz"
                        ? "PROCEED TO ONLINE PAYMENT"
                        : "CONFIRM CASH ON DELIVERY ORDER"}
                    </span>
                  </>
                )}
              </button>

              <div className="p-3 bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5 font-mono">
                <p className="flex items-center gap-1.5 text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Idempotency-protected submission</span>
                </p>
                <p className="flex items-center gap-1.5 text-zinc-300">
                  <Truck className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Real-time warehouse inventory lock</span>
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
        <div className="bg-[#0a0a0b] min-h-screen py-24 text-center text-zinc-400 font-mono text-xs flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
            <span>INITIALIZING SECURE CHECKOUT...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
