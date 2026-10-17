import React from "react";
import { getProducts } from "@/lib/services/catalog";
import { InventoryManager } from "@/components/admin/inventory-manager";

export const revalidate = 0;

export default async function AdminInventoryPage() {
  const products = await getProducts();

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-zinc-800">
        <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
          Warehouse Logistics
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Variant Inventory Control
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Monitor and adjust real-time stock levels per size/color variant to prevent overselling.
        </p>
      </div>

      <InventoryManager products={products} />
    </div>
  );
}
