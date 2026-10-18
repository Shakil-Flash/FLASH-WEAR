"use client";

import { useState } from "react";
import { OperationalReport } from "@/lib/services/analytics";
import { formatBDT } from "@/lib/utils/format-currency";
import {
  BarChart3,
  Download,
  Calendar,
  CreditCard,
  TrendingUp,
  RotateCcw,
  Truck,
  Boxes,
  Percent,
} from "lucide-react";

interface Props {
  initialReport: OperationalReport;
}

export function ReportsClient({ initialReport }: Props) {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [report, setReport] = useState<OperationalReport>(initialReport);
  const [loading, setLoading] = useState(false);

  const handleRangeChange = async (newRange: "7d" | "30d" | "90d" | "all") => {
    setRange(newRange);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=${newRange}`);
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      }
    } catch (err) {
      console.error("Filter report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/admin/reports?format=csv`;
  };

  const { metrics, ordersByStatus, paymentStatusBreakdown, paymentMethodBreakdown, bestSellers, lowStockItems, returnsRate, deliveryStats } = report;
  const funnel = (report as any).funnelMetrics || {
    productViews: 0,
    addToCartCount: 0,
    checkoutInitiationCount: 0,
    purchaseCount: metrics.totalOrders,
    addToCartRate: 0,
    checkoutCompletionRate: 0,
    conversionRate: 0,
    averageOrderValue: metrics.averageOrderValue,
    repeatCustomerRate: 0,
    couponUsageRate: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#ccff00]" />
            <span>Sales, Funnel &amp; Operational Analytics</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time shopping funnel drop-offs, verified net sales, retention rates, and inventory warnings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center bg-[#121214] border border-zinc-800 p-1 text-xs font-mono">
            {(["7d", "30d", "90d", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-3 py-1 font-bold uppercase transition-colors ${
                  range === r ? "bg-[#ccff00] text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                {r === "all" ? "All Time" : `Last ${r}`}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-2 text-xs text-[#ccff00] font-mono animate-pulse">
          Refreshing real-time analytics &amp; shopping funnel...
        </div>
      )}

      {/* Customer Shopping Funnel (Phase 3 Growth Analytics) */}
      <div className="bg-[#121214] border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Customer Shopping Funnel &amp; Conversion Rates
            </h2>
            <p className="text-xs text-zinc-400">
              Measured using standard GA4 ecommerce stage conventions across current browsing and checkout journeys
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 border border-[#ccff00]/20 rounded">
            Overall Conversion: {funnel.conversionRate}%
          </span>
        </div>

        {/* Funnel Progress Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-900/70 border border-zinc-800 p-4 relative overflow-hidden">
            <span className="text-[11px] font-mono uppercase text-zinc-400">1. Product Catalog Views</span>
            <div className="text-2xl font-black font-mono text-white mt-1">{funnel.productViews.toLocaleString()}</div>
            <div className="w-full bg-zinc-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className="bg-[#ccff00] h-full w-full" />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">100% of top-of-funnel discovery</span>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 p-4 relative overflow-hidden">
            <span className="text-[11px] font-mono uppercase text-zinc-400">2. Added to Cart</span>
            <div className="text-2xl font-black font-mono text-white mt-1">{funnel.addToCartCount.toLocaleString()}</div>
            <div className="w-full bg-zinc-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-[#ccff00] h-full"
                style={{ width: `${Math.min(100, funnel.addToCartRate * 3)}%` }}
              />
            </div>
            <span className="text-[10px] text-[#ccff00] font-mono mt-1 block">
              {funnel.addToCartRate}% add-to-cart rate
            </span>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 p-4 relative overflow-hidden">
            <span className="text-[11px] font-mono uppercase text-zinc-400">3. Checkout Started</span>
            <div className="text-2xl font-black font-mono text-white mt-1">{funnel.checkoutInitiationCount.toLocaleString()}</div>
            <div className="w-full bg-zinc-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-[#ccff00] h-full"
                style={{ width: `${Math.min(100, (funnel.checkoutInitiationCount / (funnel.addToCartCount || 1)) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
              Intent to purchase
            </span>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 p-4 relative overflow-hidden">
            <span className="text-[11px] font-mono uppercase text-zinc-400">4. Purchases Completed</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{funnel.purchaseCount.toLocaleString()}</div>
            <div className="w-full bg-zinc-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full"
                style={{ width: `${Math.min(100, funnel.checkoutCompletionRate)}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
              {funnel.checkoutCompletionRate}% checkout completion
            </span>
          </div>
        </div>

        {/* Growth & Retention Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/80">
            <div>
              <span className="text-xs text-zinc-400">Repeat Customer Rate</span>
              <strong className="text-base font-mono text-emerald-400 block mt-0.5">{funnel.repeatCustomerRate}%</strong>
            </div>
            <Percent className="w-4 h-4 text-zinc-600" />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/80">
            <div>
              <span className="text-xs text-zinc-400">Coupon Usage Rate</span>
              <strong className="text-base font-mono text-amber-400 block mt-0.5">{funnel.couponUsageRate}%</strong>
            </div>
            <Percent className="w-4 h-4 text-zinc-600" />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/80">
            <div>
              <span className="text-xs text-zinc-400">Average Order Value (AOV)</span>
              <strong className="text-base font-mono text-white block mt-0.5">{formatBDT(funnel.averageOrderValue)}</strong>
            </div>
            <TrendingUp className="w-4 h-4 text-zinc-600" />
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121214] border border-zinc-800 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Net Sales (Realized)
          </span>
          <div className="text-2xl font-black font-mono text-[#ccff00]">
            {formatBDT(metrics.netSales)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Verified Payments Received minus Refunds Completed
          </p>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Payments Received
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {formatBDT(metrics.paymentsReceived)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Online SSLCOMMERZ paid + Delivered COD orders
          </p>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Gross Order Value
          </span>
          <div className="text-2xl font-black font-mono text-white">
            {formatBDT(metrics.grossOrderValue)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Total across {metrics.totalOrders} total placed orders
          </p>
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Discounts Granted
          </span>
          <div className="text-2xl font-black font-mono text-amber-400">
            {formatBDT(metrics.discountsGranted)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Active coupon redemptions &amp; campaign deductions
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121214] border border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Average Order Value</span>
            <strong className="text-lg font-mono text-white">{formatBDT(metrics.averageOrderValue)}</strong>
          </div>
          <TrendingUp className="w-5 h-5 text-zinc-600" />
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Delivery Success Rate</span>
            <strong className="text-lg font-mono text-emerald-400">{deliveryStats.successRatePercentage}%</strong>
            <span className="text-[10px] text-zinc-500 block">{deliveryStats.deliveredCount} of {deliveryStats.totalShipped} shipped</span>
          </div>
          <Truck className="w-5 h-5 text-zinc-600" />
        </div>

        <div className="bg-[#121214] border border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Return Request Rate</span>
            <strong className="text-lg font-mono text-amber-400">{returnsRate.returnRatePercentage}%</strong>
            <span className="text-[10px] text-zinc-500 block">{returnsRate.totalRequests} return requests</span>
          </div>
          <RotateCcw className="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      {/* Order Status & Payment Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-[#121214] border border-zinc-800 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-2 border-b border-zinc-800">
            Orders by Fulfillment Status
          </h2>
          <div className="space-y-3">
            {ordersByStatus.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="uppercase text-zinc-300 font-semibold">{item.status}</span>
                  <span className="font-mono text-zinc-400">{item.count} orders ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-[#ccff00]"
                    style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods & Verification Status */}
        <div className="bg-[#121214] border border-zinc-800 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-2 border-b border-zinc-800">
            Payment Methods &amp; Status
          </h2>
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase text-zinc-500 block mb-2 font-mono">Channel Distribution</span>
              <div className="space-y-2">
                {paymentMethodBreakdown.map((item) => (
                  <div key={item.status} className="flex justify-between items-center text-xs p-2 bg-[#18181b] border border-zinc-800">
                    <span className="text-white font-medium">{item.status}</span>
                    <span className="font-mono text-[#ccff00] font-bold">{item.count} orders ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase text-zinc-500 block mb-2 font-mono">Payment Status Ledger</span>
              <div className="grid grid-cols-2 gap-2">
                {paymentStatusBreakdown.map((item) => (
                  <div key={item.status} className="p-2.5 bg-[#18181b] border border-zinc-800 text-xs">
                    <span className="text-zinc-400 uppercase text-[10px] block">{item.status}</span>
                    <strong className="text-white font-mono text-sm">{item.count} orders</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bestsellers and Low Stock Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-[#121214] border border-zinc-800 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-2 border-b border-zinc-800">
            Bestselling Streetwear
          </h2>
          {bestSellers.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4">No order items recorded in this range.</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {bestSellers.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block">{item.productName}</strong>
                    <span className="font-mono text-[10px] text-zinc-400">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right">
                    <strong className="text-[#ccff00] font-mono block">{item.unitsSold} units</strong>
                    <span className="text-zinc-500 text-[10px] font-mono">{formatBDT(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#121214] border border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
            <Boxes className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Low-Stock Inventory Warnings
            </h2>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-emerald-400 py-4">All SKU inventory counts are healthy (&gt; 5 units).</p>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-64 overflow-y-auto">
              {lowStockItems.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block">{item.productName}</strong>
                    <span className="text-zinc-400 text-[11px]">
                      Size: {item.size} &bull; Color: {item.color} &bull; SKU: <span className="font-mono">{item.sku}</span>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 font-bold font-mono text-xs">
                    {item.currentStock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
