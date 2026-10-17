import React from "react";
import Link from "next/link";
import { getProducts, getCategories } from "@/lib/services/catalog";
import { formatBDT } from "@/lib/utils/format-currency";
import { Plus, Edit, Check, X, Tag } from "lucide-react";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
            Streetwear Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Product Management
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-wider transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-[#111113] border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900/80 font-mono text-[11px] text-zinc-400 uppercase">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (BDT)</th>
                <th className="py-3 px-4">Variants & Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Badges</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 font-mono">
              {products.map((p) => {
                const totalStock = p.variants?.reduce((acc, v) => acc + v.inventory_quantity, 0) || 0;
                const variantCount = p.variants?.length || 0;

                return (
                  <tr key={p.id} className="hover:bg-zinc-900/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-zinc-950 flex-shrink-0 overflow-hidden border border-zinc-800">
                          <img
                            src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80"}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <strong className="text-white block uppercase line-clamp-1">{p.name}</strong>
                          <span className="text-[10px] text-zinc-500">{p.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {p.category?.name || "Unassigned"}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {formatBDT(p.price)}
                      {p.compare_at_price && (
                        <span className="block text-[10px] text-zinc-500 line-through">
                          {formatBDT(p.compare_at_price)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-zinc-200 block">{variantCount} Variant(s)</span>
                      <span className={`text-[10px] ${totalStock <= 5 ? "text-red-400 font-bold" : "text-zinc-500"}`}>
                        {totalStock} units available
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                          <Check className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase">
                          <X className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 space-x-1">
                      {p.is_featured && (
                        <span className="px-1.5 py-0.5 bg-[#ccff00]/10 border border-[#ccff00] text-[#ccff00] text-[9px] uppercase font-bold">
                          Featured
                        </span>
                      )}
                      {p.is_bestseller && (
                        <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 text-[9px] uppercase font-bold">
                          Bestseller
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="inline-flex items-center gap-1 text-[#ccff00] hover:underline"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
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
