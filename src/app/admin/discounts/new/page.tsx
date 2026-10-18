"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tag, AlertCircle } from "lucide-react";

export default function NewCouponPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "1000",
    max_discount_amount: "",
    usage_limit: "",
    per_customer_limit: "1",
    is_active: true,
    expires_at: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create coupon");
      }

      router.push("/admin/discounts");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/discounts"
          className="text-xs uppercase font-bold text-zinc-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discounts</span>
        </Link>
      </div>

      <div className="bg-[#121214] border border-zinc-800 p-8">
        <div className="mb-6 pb-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#ccff00]" />
            <span>Create Promotional Coupon</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Configure discount rules, threshold restrictions, and redemption caps</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FLASH25, DROP01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs font-mono font-bold text-[#ccff00] uppercase focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Discount Type *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              >
                <option value="percentage">Percentage (%) Discount</option>
                <option value="fixed">Fixed Amount (৳ BDT) Discount</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Discount Value * {formData.discount_type === "percentage" ? "(%)" : "(৳ BDT)"}
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder={formData.discount_type === "percentage" ? "10" : "200"}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Minimum Order Amount (৳ BDT)
              </label>
              <input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            {formData.discount_type === "percentage" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Maximum Discount Cap (৳ BDT) (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Global Usage Limit (Optional)
              </label>
              <input
                type="number"
                placeholder="Unlimited if empty"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Per Customer Limit
              </label>
              <input
                type="number"
                value={formData.per_customer_limit}
                onChange={(e) => setFormData({ ...formData, per_customer_limit: e.target.value })}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Description / Internal Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Eid Drop 2026 Promotional Campaign"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <Link
              href="/admin/discounts"
              className="px-4 py-2 border border-zinc-700 text-xs font-bold uppercase text-zinc-400 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#b8e600] disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Save Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
