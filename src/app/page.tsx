import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getCategories, getCollections } from "@/lib/services/catalog";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { ProductCard } from "@/components/product-card";
import { BrandMoment } from "@/components/home/brand-moment";
import { NewsletterSection } from "@/components/home/newsletter-section";

export const revalidate = 60; // 1 minute ISR for public catalog

export default async function HomePage() {
  const [categories, collections, allProducts] = await Promise.all([
    getCategories(),
    getCollections(),
    getProducts({ limit: 12 }),
  ]);

  const newArrivals = allProducts.slice(0, 4);
  const bestsellers = allProducts.filter((p) => p.is_bestseller).slice(0, 4);
  const featuredCollection = collections[0];

  return (
    <div className="flex flex-col bg-[#F7F5F0]">
      {/* 1. Editorial Hero */}
      <HeroSection />

      {/* 2. Shop by Category */}
      <FeaturedCategories categories={categories} />

      {/* 3. New Arrivals Product Grid */}
      <section className="py-16 sm:py-20 bg-[#F7F5F0] border-b border-[#E7E3DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E7E3DC]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
                Just In
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181818] mt-1">
                New arrivals
              </h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="mt-3 sm:mt-0 text-xs font-semibold text-[#181818] hover:text-[#FF5938] inline-flex items-center gap-1 transition-colors group"
            >
              <span>View all new pieces</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Brand Moment */}
      <BrandMoment />

      {/* 5. Bestsellers Curated Grid */}
      {bestsellers.length > 0 && (
        <section className="py-16 sm:py-20 bg-white border-b border-[#E7E3DC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E7E3DC]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
                  Community Favorites
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181818] mt-1">
                  Most loved pieces
                </h2>
              </div>
              <Link
                href="/shop?filter=bestseller"
                className="mt-3 sm:mt-0 text-xs font-semibold text-[#181818] hover:text-[#FF5938] inline-flex items-center gap-1 transition-colors group"
              >
                <span>View all bestsellers</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Featured Capsule Spotlight (when available) */}
      {featuredCollection && (
        <section className="py-16 sm:py-20 bg-[#F7F5F0] border-b border-[#E7E3DC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-lg overflow-hidden border border-[#E7E3DC] bg-[#181818] text-white">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 space-y-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F4D66D]">
                    Limited Capsule
                  </span>
                  <h3 className="font-display text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
                    {featuredCollection.name}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed max-w-md">
                    {featuredCollection.description}
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/collections/${featuredCollection.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      <span>Explore collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 h-64 sm:h-96 lg:h-full relative overflow-hidden bg-zinc-900">
                  <img
                    src={
                      featuredCollection.image_url ||
                      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80"
                    }
                    alt={featuredCollection.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Discreet Newsletter Signup */}
      <NewsletterSection />
    </div>
  );
}
