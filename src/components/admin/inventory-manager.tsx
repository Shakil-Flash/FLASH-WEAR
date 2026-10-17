"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { AlertTriangle, CheckCircle2, Save, Search, RefreshCw } from "lucide-react";

interface InventoryManagerProps {
  products: Product[];
}

export function InventoryManager({ products }: InventoryManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

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

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

  const handleStockUpdate = async (variantId: string) => {
    const targetQty = quantities[variantId];
    if (targetQty === undefined || targetQty < 0) {
      setMessage({ text: "Stock quantity cannot be negative.", type: "error" });
      return;
    }

    setUpdatingId(variantId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: targetQty }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }

      setMessage({ text: "Inventory adjusted successfully.", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
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
                <th className="py-3 px-4">Style & Variant</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Color</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Available Units</th>
                <th className="py-3 px-4 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 font-mono">
              {filteredVariants.map((v) => {
                const currentQty = quantities[v.id] ?? v.inventory_quantity;
                const isLow = currentQty <= 5;
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
      </div>
    </div>
  );
}
