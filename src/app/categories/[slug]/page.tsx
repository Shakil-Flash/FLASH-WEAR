import React from "react";
import { notFound } from "next/navigation";
import { getCategories, getProducts } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: params.slug }),
  ]);

  const category = categories.find((c) => c.slug === params.slug);
  if (!category) {
    notFound();
  }

  return (
    <div className="bg-[#0a0a0b] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-white">Shop</Link>
          <span>/</span>
          <span className="text-[#ccff00]">{category.name}</span>
        </div>

        {/* Hero Header */}
        <div className="pb-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#ccff00]">
              Category
            </span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-1">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xs text-zinc-400 mt-2 max-w-xl">
                {category.description}
              </p>
            )}
          </div>
          <div className="font-mono text-xs text-zinc-500">
            {products.length} Styles Available
          </div>
        </div>

        {/* Products */}
        <div className="py-12">
          {products.length === 0 ? (
            <div className="text-center py-24 bg-zinc-950 border border-zinc-900">
              <p className="text-sm font-mono text-zinc-400 mb-4">
                No active styles in this category right now.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ccff00] text-black text-xs font-semibold uppercase"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Catalog</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
