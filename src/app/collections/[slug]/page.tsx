import React from "react";
import { notFound } from "next/navigation";
import { getCollections, getProducts } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export default async function CollectionPage({ params }: CollectionPageProps) {
  const [collections, products] = await Promise.all([
    getCollections(),
    getProducts({ collectionSlug: params.slug }),
  ]);

  const collection = collections.find((c) => c.slug === params.slug);
  if (!collection) {
    notFound();
  }

  return (
    <div className="bg-[#0a0a0b] min-h-screen">
      {/* Editorial Collection Hero Banner */}
      <div className="relative py-24 sm:py-32 border-b border-zinc-800 bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={collection.image_url || "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=85"}
            alt={collection.name}
            className="w-full h-full object-cover opacity-25 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-black/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span>Collections</span>
            <span>/</span>
            <span className="text-[#ccff00]">{collection.name}</span>
          </div>

          <span className="inline-block px-2.5 py-1 bg-[#ccff00] text-black font-mono text-[10px] font-bold uppercase tracking-widest mb-3">
            Capsule Drop
          </span>
          <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tight text-white max-w-3xl leading-tight">
            {collection.name}
          </h1>
          <p className="text-sm text-zinc-300 mt-4 max-w-2xl leading-relaxed">
            {collection.description}
          </p>
        </div>
      </div>

      {/* Collection Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800 mb-8">
          <h2 className="text-sm font-mono uppercase tracking-wider text-white">
            Capsule Pieces ({products.length})
          </h2>
          <Link
            href="/shop"
            className="text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-[#ccff00] flex items-center gap-1"
          >
            <span>Browse All Capsules</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950 border border-zinc-900">
            <p className="text-sm font-mono text-zinc-400 mb-4">
              All styles in this capsule have sold out.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ccff00] text-black text-xs font-semibold uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Streetwear</span>
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
  );
}
