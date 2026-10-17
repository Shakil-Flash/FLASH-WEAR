import React from "react";
import { getCategories } from "@/lib/services/catalog";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-zinc-800">
        <span className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
          Taxonomy & Hierarchy
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Category Management
        </h1>
      </div>

      <CategoriesManager categories={categories} />
    </div>
  );
}
