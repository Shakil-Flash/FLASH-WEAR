import React from "react";
import Link from "next/link";
import { getProducts, getCategories, getCollections } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product-card";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

interface ShopPageProps {
  searchParams: {
    category?: string;
    collection?: string;
    size?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: "newest" | "price_asc" | "price_desc" | "popularity";
    q?: string;
    filter?: "bestseller" | "featured";
  };
}

export const revalidate = 60;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [categories, collections, products] = await Promise.all([
    getCategories(),
    getCollections(),
    getProducts({
      categorySlug: searchParams.category,
      collectionSlug: searchParams.collection,
      size: searchParams.size,
      color: searchParams.color,
      minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
      sort: searchParams.sort,
      search: searchParams.q,
      bestseller: searchParams.filter === "bestseller",
      featured: searchParams.filter === "featured",
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === searchParams.category);
  const activeCollection = collections.find((c) => c.slug === searchParams.collection);

  return (
    <div className="bg-[#0a0a0b] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="pb-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-zinc-500 mb-1">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-[#ccff00]">Catalog</span>
              {activeCategory && (
                <>
                  <span>/</span>
                  <span className="text-white">{activeCategory.name}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              {activeCategory ? activeCategory.name : activeCollection ? activeCollection.name : "All Streetwear"}
            </h1>
            <p className="text-xs text-zinc-400 mt-2 max-w-xl">
              {activeCategory?.description ||
                activeCollection?.description ||
                "Engineered silhouettes, custom heavyweight fabrics, and boxy streetwear fits."}
            </p>
          </div>

          <div className="font-mono text-xs text-zinc-500">
            Showing <strong className="text-white">{products.length}</strong> styles
          </div>
        </div>

        {/* Filter Bar & Sorting */}
        <div className="py-6 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          {/* Quick Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/shop"
              className={`px-3 py-1.5 text-xs uppercase font-mono tracking-wider transition-colors ${
                !searchParams.category && !searchParams.collection
                  ? "bg-[#ccff00] text-black font-bold"
                  : "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`px-3 py-1.5 text-xs uppercase font-mono tracking-wider transition-colors ${
                  searchParams.category === cat.slug
                    ? "bg-[#ccff00] text-black font-bold"
                    : "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-mono text-zinc-500 uppercase">Sort:</span>
            <div className="flex gap-1">
              <Link
                href={{
                  pathname: "/shop",
                  query: { ...searchParams, sort: "newest" },
                }}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase ${
                  !searchParams.sort || searchParams.sort === "newest"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Newest
              </Link>
              <Link
                href={{
                  pathname: "/shop",
                  query: { ...searchParams, sort: "price_asc" },
                }}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase ${
                  searchParams.sort === "price_asc"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Price: Low-High
              </Link>
              <Link
                href={{
                  pathname: "/shop",
                  query: { ...searchParams, sort: "price_desc" },
                }}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase ${
                  searchParams.sort === "price_desc"
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Price: High-Low
              </Link>
            </div>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        <div className="py-12">
          {products.length === 0 ? (
            <div className="text-center py-24 bg-zinc-950 border border-zinc-900 p-8">
              <h3 className="text-base font-mono uppercase text-white mb-2">
                No styles found matching criteria
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                Try resetting your filters to explore all available streetwear pieces.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ccff00] text-black text-xs font-semibold uppercase hover:bg-[#b8e600]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
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
