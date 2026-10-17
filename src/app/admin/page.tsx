import React from "react";
import Link from "next/link";
import { getAdminOrders } from "@/lib/services/orders";
import { getProducts, getCategories } from "@/lib/services/catalog";
import { formatBDT } from "@/lib/utils/format-currency";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  Boxes,
} from "lucide-react";

export const revalidate = 0; // Dynamic admin metrics

export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([
    getAdminOrders(),
    getProducts(),
  ]);

  // Explicit policy: sales from all non-cancelled orders
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const totalSales = activeOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  // Inventory analysis: count low-stock variants (quantity <= 5)
  let lowStockCount = 0;
  for (const p of products) {
    for (const v of p.variants || []) {
      if (v.inventory_quantity <= 5) {
        lowStockCount++;
      }
    }
  }

  const recentOrders = orders.slice(0, 5);
  const topProducts = products.filter((p) => p.is_bestseller).slice(0, 4);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
            FLASHWEAR Operations
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
            Overview Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-[#ccff00] text-black text-xs font-bold font-mono uppercase hover:bg-[#b8e600] transition-colors"
          >
            + Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-mono uppercase hover:bg-zinc-800 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 bg-[#111113] border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono uppercase tracking-wider">Gross Sales (COD)</span>
            <DollarSign className="w-4 h-4 text-[#ccff00]" />
          </div>
          <div className="mt-4">
            <h3 className="font-mono text-2xl font-bold text-white">
              {formatBDT(totalSales)}
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              Active orders (excludes cancellations)
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-[#111113] border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono uppercase tracking-wider">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-[#ccff00]" />
          </div>
          <div className="mt-4">
            <h3 className="font-mono text-2xl font-bold text-white">
              {orders.length}
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              {orders.length === 0 ? "Awaiting first customer order" : "All-time orders"}
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-5 bg-[#111113] border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono uppercase tracking-wider">Pending Delivery</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <h3 className="font-mono text-2xl font-bold text-amber-400">
              {pendingOrders}
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              Requires warehouse confirmation
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 bg-[#111113] border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono uppercase tracking-wider">Low Stock SKUs</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? "text-red-400" : "text-zinc-500"}`} />
          </div>
          <div className="mt-4">
            <h3 className={`font-mono text-2xl font-bold ${lowStockCount > 0 ? "text-red-400" : "text-zinc-400"}`}>
              {lowStockCount}
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              Variants with ≤ 5 units
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Catalog Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 p-6 bg-[#111113] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
              Recent Cash on Delivery Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-mono text-[#ccff00] hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-zinc-500">
              No orders recorded yet. When guests place Cash on Delivery orders, they will appear here in real-time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/60 font-mono text-[11px] text-zinc-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 px-3 font-bold text-white">{ord.order_number}</td>
                      <td className="py-3 px-3 text-zinc-300">{ord.customer_name}</td>
                      <td className="py-3 px-3 text-zinc-400">{ord.district}</td>
                      <td className="py-3 px-3 font-bold text-[#ccff00]">{formatBDT(ord.total_amount)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-zinc-800 text-[10px] uppercase font-semibold text-zinc-300">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="text-[#ccff00] hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bestselling Streetwear Products */}
        <div className="lg:col-span-4 p-6 bg-[#111113] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
              Bestseller Pieces
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-mono text-[#ccff00] hover:underline"
            >
              Catalog →
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.map((p) => {
              const stock = p.variants?.reduce((acc, v) => acc + v.inventory_quantity, 0) || 0;
              return (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-zinc-900/50 border border-zinc-800/80">
                  <div className="w-10 h-12 bg-zinc-950 flex-shrink-0 overflow-hidden">
                    <img
                      src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs uppercase font-medium text-white truncate">
                      {p.name}
                    </h4>
                    <p className="text-[11px] font-mono text-zinc-400">
                      {formatBDT(p.price)} • {stock} in stock
                    </p>
                  </div>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-[10px] font-mono uppercase text-[#ccff00] px-2 py-1 bg-zinc-800 hover:bg-zinc-700"
                  >
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
