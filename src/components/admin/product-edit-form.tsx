"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Save, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

interface ProductEditFormProps {
  product: Product;
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price.toString(),
    compareAtPrice: product.compare_at_price ? product.compare_at_price.toString() : "",
    description: product.description,
    details: product.details || "",
    isPublished: product.is_published,
    isFeatured: product.is_featured,
    isBestseller: product.is_bestseller,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          name: formData.name,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          description: formData.description,
          details: formData.details,
          isPublished: formData.isPublished,
          isFeatured: formData.isFeatured,
          isBestseller: formData.isBestseller,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }

      setMessage({ text: "Product updated successfully.", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {message && (
        <div
          className={`p-4 border text-xs font-mono flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
          Product Details
        </h3>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-mono text-zinc-400">Title</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Price (BDT ৳)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Compare-at Price (BDT ৳)</label>
            <input
              type="number"
              value={formData.compareAtPrice}
              onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-mono text-zinc-400">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-mono text-zinc-400">Fabric & Care Specs</label>
          <textarea
            rows={3}
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-zinc-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 accent-[#ccff00]"
            />
            <span className="text-white">Published on Storefront</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 accent-[#ccff00]"
            />
            <span className="text-white">Featured Drop</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
            <input
              type="checkbox"
              checked={formData.isBestseller}
              onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
              className="w-4 h-4 accent-[#ccff00]"
            />
            <span className="text-white">Bestseller</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#ccff00] hover:bg-[#b8e600] text-black font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
        </button>
        <Link
          href="/admin/products"
          className="px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white uppercase text-xs font-mono"
        >
          Back to List
        </Link>
      </div>
    </form>
  );
}
