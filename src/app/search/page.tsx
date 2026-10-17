import React from "react";
import Link from "next/link";
import { getProducts } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product-card";
import { Search } from "lucide-react";

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  const products = query ? await getProducts({ search: query }) : [];

  return (
    <div className="bg-[#0a0a0b] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search header */}
        <div className="pb-8 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-[#ccff00]">Search</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
            {query ? `Search Results for "${query}"` : "Search Catalog"}
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-2">
            Found {products.length} match{products.length === 1 ? "" : "es"}
          </p>
        </div>

        {/* Results */}
        <div className="py-12">
          {products.length === 0 ? (
            <div className="text-center py-24 bg-zinc-950 border border-zinc-900 p-8">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-mono uppercase text-white mb-2">
                No matching apparel found
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
                Try searching for broader keywords like "Hoodie", "Oversized", "Acid", "Cargo", or "Tee".
              </p>
              <Link
                href="/shop"
                className="px-6 py-2.5 bg-[#ccff00] text-black text-xs font-semibold uppercase hover:bg-[#b8e600]"
              >
                Browse All Apparel
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
