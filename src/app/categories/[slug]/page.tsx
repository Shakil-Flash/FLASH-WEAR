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
    <div className="bg-[#F7F5F0] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#74716D] mb-4">
          <Link href="/" className="hover:text-[#181818] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#181818] transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-[#FF5938] font-medium">{category.name}</span>
        </div>

        {/* Hero Header */}
        <div className="pb-8 border-b border-[#E7E3DC] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
              Category
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#181818] mt-1">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm text-[#74716D] mt-2 max-w-xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
          <div className="text-xs text-[#74716D]">
            Showing <strong className="text-[#181818] font-semibold">{products.length}</strong> styles
          </div>
        </div>

        {/* Products Grid */}
        <div className="py-10">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-[#E7E3DC] p-8">
              <p className="text-sm font-medium text-[#74716D] mb-4">
                No active styles in this category right now.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-semibold rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Catalog</span>
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
