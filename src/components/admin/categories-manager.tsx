"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@/lib/types";
import { Plus, FolderTree, AlertCircle, CheckCircle2 } from "lucide-react";

interface CategoriesManagerProps {
  categories: Category[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, imageUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create category");
      }

      setMessage({ text: "Category created successfully.", type: "success" });
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl("");
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Create Category Form */}
      <div className="lg:col-span-5 p-6 bg-[#111113] border border-zinc-800 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
          Add New Category
        </h3>

        {message && (
          <div
            className={`p-3 border text-xs font-mono flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                : "bg-red-950/40 border-red-800 text-red-400"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Tactical Vests"
              className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tactical-vests"
              className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short category summary..."
              className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-zinc-800 text-black font-bold uppercase text-xs tracking-wider transition-colors"
          >
            {isSubmitting ? "Creating..." : "Save Category"}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="lg:col-span-7 bg-[#111113] border border-zinc-800 overflow-hidden">
        <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white">
            Active Categories ({categories.length})
          </h3>
        </div>

        <div className="divide-y divide-zinc-800/80 font-mono text-xs">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40">
              <div className="flex items-center gap-3">
                {cat.image_url && (
                  <div className="w-12 h-14 bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800">
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold uppercase text-white">{cat.name}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{cat.slug}</p>
                  <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{cat.description}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
