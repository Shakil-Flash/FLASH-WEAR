import React from "react";
import Link from "next/link";
import { getProducts, getCategories, getCollections } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product-card";
import { RotateCcw } from "lucide-react";

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
    <div className="bg-[#F7F5F0] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="pb-8 border-b border-[#E7E3DC] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#74716D] mb-2">
              <Link href="/" className="hover:text-[#181818] transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#181818] font-medium">Catalog</span>
              {activeCategory && (
                <>
                  <span>/</span>
                  <span className="text-[#FF5938] font-medium">{activeCategory.name}</span>
                </>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#181818]">
              {activeCategory ? activeCategory.name : activeCollection ? activeCollection.name : "All Streetwear"}
            </h1>
            <p className="text-sm text-[#74716D] mt-2 max-w-xl leading-relaxed">
              {activeCategory?.description ||
                activeCollection?.description ||
                "Relaxed silhouettes, heavyweight French terry, and boxy everyday fits."}
            </p>
          </div>

          <div className="text-xs text-[#74716D]">
            Showing <strong className="text-[#181818] font-semibold">{products.length}</strong> styles
          </div>
        </div>

        {/* Filter Bar & Sorting */}
        <div className="py-5 sm:py-6 border-b border-[#E7E3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs with smooth mobile horizontal scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0">
            <Link
              href="/shop"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                !searchParams.category && !searchParams.collection
                  ? "bg-[#181818] text-white shadow-xs"
                  : "bg-white text-[#74716D] hover:text-[#181818] border border-[#E7E3DC]"
              }`}
            >
              All Pieces
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  searchParams.category === cat.slug
                    ? "bg-[#181818] text-white shadow-xs"
                    : "bg-white text-[#74716D] hover:text-[#181818] border border-[#E7E3DC]"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t border-[#E7E3DC]/60 sm:border-t-0 sm:ml-auto">
            <span className="text-xs text-[#74716D] font-medium shrink-0">Sort:</span>
            <div className="flex gap-1.5 overflow-x-auto">
              <Link
                href={{
                  pathname: "/shop",
                  query: { ...searchParams, sort: "newest" },
                }}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  !searchParams.sort || searchParams.sort === "newest"
                    ? "bg-[#181818] text-white font-semibold"
                    : "text-[#74716D] hover:text-[#181818]"
                }`}
              >
                Newest
              </Link>
              <Link
                href={{
                  pathname: "/shop",
                  query: { ...searchParams, sort: "price_asc" },
                }}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  searchParams.sort === "price_asc"
                    ? "bg-[#181818] text-white font-semibold"
                    : "text-[#74716D] hover:text-[#181818]"
                }`}
              >
                Price: Low to High
              </Link>
              <Link
                href={{
                  pathname: "/shop",
                  query: { ...searchParams, sort: "price_desc" },
                }}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  searchParams.sort === "price_desc"
                    ? "bg-[#181818] text-white font-semibold"
                    : "text-[#74716D] hover:text-[#181818]"
                }`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        <div className="py-10">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-[#E7E3DC] p-8">
              <h3 className="text-base font-semibold text-[#181818] mb-1">
                No styles found matching criteria
              </h3>
              <p className="text-xs text-[#74716D] max-w-sm mx-auto mb-6">
                Try resetting your filters to explore all available everyday pieces.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-semibold rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
