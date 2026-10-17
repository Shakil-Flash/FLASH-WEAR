import React from "react";
import { getCollections } from "@/lib/services/catalog";
import { CollectionsManager } from "@/components/admin/collections-manager";

export const revalidate = 0;

export default async function AdminCollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-zinc-800">
        <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
          Capsule Drops
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Collection Management
        </h1>
      </div>

      <CollectionsManager collections={collections} />
    </div>
  );
}
