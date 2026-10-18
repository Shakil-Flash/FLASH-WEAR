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
    <div className="bg-[#F7F5F0] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search header */}
        <div className="pb-8 border-b border-[#E7E3DC]">
          <div className="flex items-center gap-2 text-xs text-[#74716D] mb-2">
            <Link href="/" className="hover:text-[#181818] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#FF5938] font-medium">Search</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#181818]">
            {query ? `Search results for "${query}"` : "Search Catalog"}
          </h1>
          <p className="text-xs text-[#74716D] mt-2">
            Found {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {/* Results */}
        <div className="py-10">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-[#E7E3DC] p-8 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#F7F5F0] border border-[#E7E3DC] flex items-center justify-center mx-auto mb-4 text-[#74716D]">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#181818] mb-1">
                No matching apparel found
              </h3>
              <p className="text-xs text-[#74716D] max-w-sm mx-auto mb-6 leading-relaxed">
                Try searching for general keywords like "Hoodie", "Oversized", "Cargo", or "Tee".
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-semibold rounded-md transition-colors"
              >
                Browse All Apparel
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
