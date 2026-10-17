"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, Save, AlertCircle } from "lucide-react";

export default function AdminNewProductPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    details: "",
    price: "",
    compareAtPrice: "",
    categoryId: "",
    collectionId: "",
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
  });

  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85",
  ]);

  const [variants, setVariants] = useState<
    { size: string; color: string; sku: string; quantity: number }[]
  >([
    { size: "M", color: "Obsidian Black", sku: "FW-NEW-BLK-M", quantity: 15 },
    { size: "L", color: "Obsidian Black", sku: "FW-NEW-BLK-L", quantity: 20 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, ""),
    }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages((prev) => [...prev, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: "M",
        color: "Obsidian Black",
        sku: `FW-${Date.now().toString().slice(-4)}`,
        quantity: 10,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: string, value: any) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.slug.trim()) {
      setError("Product title and slug are required.");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Please provide a valid price in BDT.");
      return;
    }
    if (variants.length === 0) {
      setError("Please define at least one variant (size & color).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          images,
          variants,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-zinc-400 hover:text-white mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Create Streetwear Product
          </h1>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 text-xs font-mono text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details */}
        <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
            1. General Product Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-zinc-400">
                Product Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Matrix Heavy Hoodie"
                className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-zinc-400">
                URL Slug <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="matrix-heavy-hoodie"
                className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed silhouette and lifestyle description..."
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">
              Fabric, Fit & Care Bullet Points
            </label>
            <textarea
              rows={3}
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="• 480 GSM French Terry Cotton&#10;• Pre-shrunk silicone wash&#10;• Machine wash cold"
              className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
            />
          </div>
        </div>

        {/* Pricing & Flags */}
        <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
            2. Pricing in Bangladeshi Taka (BDT)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-zinc-400">
                Price (BDT ৳) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="3450"
                className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-zinc-400">
                Compare-at Original Price (BDT ৳) <span className="text-zinc-500">(Optional for discount badge)</span>
              </label>
              <input
                type="number"
                step="1"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                placeholder="3950"
                className="w-full bg-[#18181b] border border-zinc-700 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              />
            </div>
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
              <span className="text-white">Featured Drop Tag</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
              <input
                type="checkbox"
                checked={formData.isBestseller}
                onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                className="w-4 h-4 accent-[#ccff00]"
              />
              <span className="text-white">Bestseller Badge</span>
            </label>
          </div>
        </div>

        {/* Product Images */}
        <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
            3. Product Images
          </h2>

          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste public image URL (Unsplash, Supabase Storage, CDN)..."
              className="flex-1 bg-[#18181b] border border-zinc-700 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono uppercase"
            >
              Add Image
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-[3/4] bg-zinc-950 border border-zinc-800 overflow-hidden group">
                <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-2 right-2 p-1.5 bg-black/80 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-[10px] font-mono text-zinc-400">
                  {i === 0 ? "Primary" : `#${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Variant Builder */}
        <div className="p-6 bg-[#111113] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-white">
              4. Sizes, Colors & Variant Inventory
            </h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-[#ccff00] text-xs font-mono uppercase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant</span>
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-zinc-900 border border-zinc-800">
                <div className="w-20">
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase">Size</label>
                  <input
                    type="text"
                    value={v.size}
                    onChange={(e) => handleUpdateVariant(i, "size", e.target.value)}
                    placeholder="M"
                    className="w-full bg-[#18181b] border border-zinc-700 px-2 py-1 text-xs text-white"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase">Color</label>
                  <input
                    type="text"
                    value={v.color}
                    onChange={(e) => handleUpdateVariant(i, "color", e.target.value)}
                    placeholder="Obsidian Black"
                    className="w-full bg-[#18181b] border border-zinc-700 px-2 py-1 text-xs text-white"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase">SKU</label>
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleUpdateVariant(i, "sku", e.target.value)}
                    placeholder="FW-HD-01-BLK-M"
                    className="w-full bg-[#18181b] border border-zinc-700 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={v.quantity}
                    onChange={(e) => handleUpdateVariant(i, "quantity", parseInt(e.target.value) || 0)}
                    className="w-full bg-[#18181b] border border-zinc-700 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(i)}
                    className="p-1.5 text-zinc-500 hover:text-red-400"
                    title="Remove variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-zinc-800 text-black font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-colors shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Publishing Product..." : "Save & Publish Product"}</span>
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white uppercase text-xs font-mono"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
