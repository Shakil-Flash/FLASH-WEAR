import React from "react";
import Link from "next/link";
import { getAdminOrders } from "@/lib/services/orders";
import { formatBDT } from "@/lib/utils/format-currency";
import { Search, Filter, Eye } from "lucide-react";

interface AdminOrdersPageProps {
  searchParams: {
    status?: string;
    q?: string;
  };
}

export const revalidate = 0;

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const statusFilter = searchParams.status || "all";
  const search = searchParams.q || "";

  const orders = await getAdminOrders(statusFilter, search);

  const statuses = [
    { label: "All Orders", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
            Fulfilment & Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Orders Management
          </h1>
        </div>
        <div className="font-mono text-xs text-zinc-400">
          Total: <strong className="text-white">{orders.length}</strong> orders
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
        {statuses.map((s) => (
          <Link
            key={s.value}
            href={`/admin/orders?status=${s.value}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
              statusFilter === s.value
                ? "bg-[#ccff00] text-black font-bold"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-[#111113] border border-zinc-800 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-zinc-500">
            No orders found matching the selected filter ({statusFilter}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-900/80 font-mono text-[11px] text-zinc-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Delivery District</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Amount (BDT)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 font-mono">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-900/50">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {ord.order_number}
                      <span className="block text-[10px] text-zinc-500 font-normal">
                        {new Date(ord.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-zinc-200 block">{ord.customer_name}</strong>
                      <span className="text-zinc-400 text-[11px]">{ord.customer_phone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {ord.district}, {ord.division}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {ord.items?.length || 1} SKU(s)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#ccff00]">
                      {formatBDT(ord.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold ${
                          ord.status === "delivered"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : ord.status === "cancelled"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : ord.status === "shipped"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : ord.status === "processing"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-[#ccff00] hover:text-black text-zinc-300 border border-zinc-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
