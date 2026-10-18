"use client";

import { useState } from "react";
import Link from "next/link";
import { Coupon } from "@/lib/types";
import { Plus, Tag, Search, CheckCircle, XCircle } from "lucide-react";

interface Props {
  initialCoupons: Coupon[];
}

export function DiscountsClient({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [search, setSearch] = useState("");

  const handleToggle = async (couponId: string, currentActive: boolean) => {
    try {
      await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId, isActive: !currentActive }),
      });
      setCoupons(
        coupons.map((c) => (c.id === couponId ? { ...c, is_active: !currentActive } : c))
      );
    } catch (err) {
      console.error("Toggle coupon active error:", err);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Discounts &amp; Coupons</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage promotional campaign vouchers, redemption caps, and eligibility</p>
        </div>
        <Link
          href="/admin/discounts/new"
          className="px-4 py-2 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#b8e600] self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </Link>
      </div>

      <div className="bg-[#121214] border border-zinc-800 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#18181b] border border-zinc-700 pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
          />
        </div>
      </div>

      <div className="bg-[#121214] border border-zinc-800 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#18181b] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono">
            <tr>
              <th className="p-4">Coupon Code</th>
              <th className="p-4">Type &amp; Discount</th>
              <th className="p-4">Min Order</th>
              <th className="p-4">Usage / Limit</th>
              <th className="p-4">Expiry</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filteredCoupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="p-4">
                  <div className="font-mono font-bold text-white text-sm">{coupon.code}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{coupon.description}</div>
                </td>
                <td className="p-4 font-mono font-bold text-[#ccff00]">
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_value}% OFF`
                    : `৳${coupon.discount_value.toLocaleString()} FLAT`}
                  {coupon.max_discount_amount && (
                    <span className="block text-[10px] text-zinc-400 font-normal">
                      Max: ৳{coupon.max_discount_amount}
                    </span>
                  )}
                </td>
                <td className="p-4 font-mono">
                  ৳{coupon.min_order_amount.toLocaleString()}
                </td>
                <td className="p-4 font-mono">
                  {coupon.used_count} / {coupon.usage_limit ? coupon.usage_limit : "∞"}
                </td>
                <td className="p-4 text-zinc-400">
                  {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : "Never"}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 uppercase font-bold text-[10px] ${
                      coupon.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {coupon.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggle(coupon.id, coupon.is_active)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold uppercase transition-colors"
                  >
                    {coupon.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
