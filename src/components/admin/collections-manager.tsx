"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Collection } from "@/lib/types";
import { Plus, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

interface CollectionsManagerProps {
  collections: Collection[];
}

export function CollectionsManager({ collections }: CollectionsManagerProps) {
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
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, imageUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create collection");
      }

      setMessage({ text: "Collection created successfully.", type: "success" });
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
      {/* Create Collection Form */}
      <div className="lg:col-span-5 p-6 bg-[#111113] border border-zinc-800 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white border-b border-zinc-800 pb-2">
          Create New Capsule Collection
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
            <label className="block text-xs uppercase font-mono text-zinc-400">Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Drop 02: Neon District"
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
              placeholder="drop-02-neon-district"
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
              placeholder="Atmospheric concept and editorial narrative..."
              className="w-full bg-[#18181b] border border-zinc-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-mono text-zinc-400">Campaign Image URL</label>
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
            {isSubmitting ? "Creating..." : "Save Collection"}
          </button>
        </form>
      </div>

      {/* Collections List */}
      <div className="lg:col-span-7 bg-[#111113] border border-zinc-800 overflow-hidden">
        <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white">
            Curated Collections ({collections.length})
          </h3>
        </div>

        <div className="divide-y divide-zinc-800/80 font-mono text-xs">
          {collections.map((col) => (
            <div key={col.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40">
              <div className="flex items-center gap-3">
                {col.image_url && (
                  <div className="w-14 h-16 bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800">
                    <img src={col.image_url} alt={col.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold uppercase text-white">{col.name}</h4>
                  <p className="text-[11px] text-[#ccff00] mt-0.5">{col.slug}</p>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{col.description}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-[#ccff00]/10 border border-[#ccff00] text-[#ccff00] text-[10px] uppercase font-bold">
                Live Capsule
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
