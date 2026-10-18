"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  History,
  Boxes,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

interface InventoryManagerProps {
  products: Product[];
}

interface AuditRecord {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

const COMMON_REASONS = [
  "Physical warehouse cycle count reconciliation",
  "Vendor restock intake batch",
  "Damaged / defective garment write-off",
  "Customer exchange / return restocked after QA",
  "Studio sample / photography staging allocation",
  "Inventory discrepancy correction",
];

export function InventoryManager({ products }: InventoryManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inventory" | "audits">("inventory");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);

  // Flatten variants with product details
  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      ...v,
      productName: p.name,
      productSlug: p.slug,
      productPrice: p.price,
      productImage: p.images?.[0]?.url,
    }))
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const v of allVariants) {
      map[v.id] = v.inventory_quantity;
    }
    return map;
  });

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Compute operational statistics
  const totalVariantsCount = allVariants.length;
  const lowStockCount = allVariants.filter(
    (v) => (quantities[v.id] ?? v.inventory_quantity) > 0 && (quantities[v.id] ?? v.inventory_quantity) <= 5
  ).length;
  const outOfStockCount = allVariants.filter(
    (v) => (quantities[v.id] ?? v.inventory_quantity) <= 0
  ).length;
  const negativeStockCount = allVariants.filter(
    (v) => (quantities[v.id] ?? v.inventory_quantity) < 0
  ).length;

  const filteredVariants = allVariants.filter((v) => {
    const matchesSearch =
      v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.color.toLowerCase().includes(searchTerm.toLowerCase());

    if (showLowStockOnly) {
      return matchesSearch && (quantities[v.id] ?? v.inventory_quantity) <= 5;
    }
    return matchesSearch;
  });

  const fetchAudits = async () => {
    setAuditsLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (data.success && data.recentAudits) {
        setAudits(data.recentAudits);
      }
    } catch {
      // Ignored
    } finally {
      setAuditsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audits") {
      fetchAudits();
    }
  }, [activeTab]);

  const handleStockUpdate = async (variantId: string) => {
    const targetQty = quantities[variantId];
    if (targetQty === undefined || targetQty < 0) {
      setMessage({ text: "Stock quantity cannot be negative.", type: "error" });
      return;
    }

    const reason = (reasons[variantId] || "").trim() || "Physical warehouse cycle count reconciliation";

    setUpdatingId(variantId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: targetQty, reason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }

      setMessage({
        text: `Inventory for variant adjusted to ${targetQty} units (Reason: ${reason}).`,
        type: "success",
      });
      router.refresh();
      if (activeTab === "audits") {
        fetchAudits();
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Operational Inventory Health Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-[#111113] border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Total Tracked</span>
            <strong className="text-xl text-white font-bold">{totalVariantsCount}</strong>
            <span className="text-[10px] text-zinc-500 block">variants</span>
          </div>
          <Boxes className="w-5 h-5 text-zinc-500" />
        </div>

        <div className="p-4 bg-[#111113] border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-400 uppercase tracking-widest block">Low Stock (≤ 5)</span>
            <strong className="text-xl text-amber-400 font-bold">{lowStockCount}</strong>
            <span className="text-[10px] text-zinc-500 block">urgent re-batch</span>
          </div>
          <TrendingDown className="w-5 h-5 text-amber-400" />
        </div>

        <div className="p-4 bg-[#111113] border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-red-400 uppercase tracking-widest block">Out of Stock</span>
            <strong className="text-xl text-red-400 font-bold">{outOfStockCount}</strong>
            <span className="text-[10px] text-zinc-500 block">storefront hidden</span>
          </div>
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>

        <div className="p-4 bg-[#111113] border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Stock Integrity</span>
            <strong className={`text-base font-bold ${negativeStockCount > 0 ? "text-red-500" : "text-emerald-400"}`}>
              {negativeStockCount > 0 ? `${negativeStockCount} Anomalies` : "100% Reconciled"}
            </strong>
            <span className="text-[10px] text-zinc-500 block">no negative records</span>
          </div>
          <ShieldAlert className={`w-5 h-5 ${negativeStockCount > 0 ? "text-red-500" : "text-emerald-400"}`} />
        </div>
      </div>

      {message && (
        <div
          className={`p-3 border text-xs font-mono flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 font-mono text-xs">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2.5 font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "inventory"
              ? "border-[#ccff00] text-[#ccff00]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Active Variant Stock ({filteredVariants.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("audits")}
          className={`px-4 py-2.5 font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "audits"
              ? "border-[#ccff00] text-[#ccff00]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Adjustment Audit Trail</span>
        </button>
      </div>

      {activeTab === "inventory" ? (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#111113] border border-zinc-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by SKU, style, size, color..."
                className="w-full bg-[#18181b] border border-zinc-700 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#ccff00]"
                />
                <span className="text-zinc-300">Show Low Stock Only (≤ 5)</span>
              </label>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-[#111113] border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/80 font-mono text-[11px] text-zinc-400 uppercase">
                  <tr>
                    <th className="py-3 px-4">Style &amp; Variant</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Color</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Available Units</th>
                    <th className="py-3 px-4">Authorized Reason</th>
                    <th className="py-3 px-4 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono">
                  {filteredVariants.map((v) => {
                    const currentQty = quantities[v.id] ?? v.inventory_quantity;
                    const isLow = currentQty > 0 && currentQty <= 5;
                    const isOut = currentQty <= 0;

                    return (
                      <tr key={v.id} className="hover:bg-zinc-900/50">
                        <td className="py-3 px-4 font-bold text-white">
                          {v.productName}
                        </td>
                        <td className="py-3 px-4 text-zinc-300 font-mono">{v.sku}</td>
                        <td className="py-3 px-4 text-white font-bold">{v.size}</td>
                        <td className="py-3 px-4 text-zinc-300">{v.color}</td>
                        <td className="py-3 px-4 text-zinc-400">{formatBDT(v.productPrice)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold ${
                              isOut
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : isLow
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-zinc-800 text-zinc-200"
                            }`}
                          >
                            {isLow && <AlertTriangle className="w-3 h-3" />}
                            <span>{currentQty} in stock</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            list="reason-presets"
                            value={reasons[v.id] || ""}
                            onChange={(e) =>
                              setReasons({
                                ...reasons,
                                [v.id]: e.target.value,
                              })
                            }
                            placeholder="Reconciliation reason..."
                            className="w-48 bg-[#18181b] border border-zinc-700 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              min="0"
                              value={currentQty}
                              onChange={(e) =>
                                setQuantities({
                                  ...quantities,
                                  [v.id]: Math.max(0, parseInt(e.target.value) || 0),
                                })
                              }
                              className="w-16 bg-[#18181b] border border-zinc-700 px-2 py-1 text-xs text-white text-center font-mono focus:outline-none focus:border-[#ccff00]"
                            />
                            <button
                              onClick={() => handleStockUpdate(v.id)}
                              disabled={updatingId === v.id}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-[#ccff00] hover:text-black text-white text-xs font-mono uppercase transition-colors"
                            >
                              {updatingId === v.id ? "Saving..." : "Set"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <datalist id="reason-presets">
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
        </>
      ) : (
        /* Audit Trail Tab */
        <div className="bg-[#111113] border border-zinc-800 overflow-hidden font-mono">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                Manual Inventory Adjustment Log
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Every quantity change requires staff attribution and an operational reason.
              </p>
            </div>
            <button
              onClick={fetchAudits}
              disabled={auditsLoading}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 uppercase"
            >
              {auditsLoading ? "Refreshing..." : "Refresh Logs"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-900/80 text-[11px] text-zinc-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product &amp; SKU</th>
                  <th className="py-3 px-4">Change</th>
                  <th className="py-3 px-4">Authorized Reason</th>
                  <th className="py-3 px-4 text-right">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No manual stock adjustments recorded yet in this session.
                    </td>
                  </tr>
                ) : (
                  audits.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(a.createdAt).toLocaleString("en-BD")}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <div>{a.productName}</div>
                        <span className="text-[10px] text-zinc-400 font-normal">{a.sku}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                          <span className="text-zinc-400">{a.previousQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-500" />
                          <span className="text-white">{a.newQuantity}</span>
                          <span
                            className={`text-[10px] ml-1 px-1.5 py-0.2 rounded ${
                              a.difference > 0
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : a.difference < 0
                                ? "bg-red-950 text-red-400 border border-red-800"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {a.difference > 0 ? `+${a.difference}` : a.difference}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">{a.reason}</td>
                      <td className="py-3 px-4 text-right text-zinc-400">{a.adjustedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
