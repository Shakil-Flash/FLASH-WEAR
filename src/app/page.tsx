import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getProducts, getCategories, getCollections } from "@/lib/services/catalog";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { ProductCard } from "@/components/product-card";
import { BrandStory } from "@/components/home/brand-story";
import { ReviewsSection } from "@/components/home/reviews-section";
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
    <div className="flex flex-col">
      {/* 1. Large Editorial Hero Section */}
      <HeroSection />

      {/* 2. Shop by Category Grid */}
      <FeaturedCategories categories={categories} />

      {/* 3. New Arrivals Section */}
      <section className="py-20 bg-[#0a0a0b] border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#ccff00]">
                Fresh Off The Runway
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="mt-4 sm:mt-0 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-[#ccff00] flex items-center gap-1 group"
            >
              <span>View All New</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Curated Collection Banner */}
      {featuredCollection && (
        <section className="relative py-28 border-b border-zinc-800 overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <img
              src={featuredCollection.image_url || "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=85"}
              alt={featuredCollection.name}
              className="w-full h-full object-cover opacity-25 filter contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl space-y-4">
              <span className="inline-block px-2.5 py-1 bg-[#ccff00] text-black font-mono text-[10px] font-bold uppercase tracking-widest">
                Curated Capsule
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                {featuredCollection.name}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {featuredCollection.description}
              </p>
              <div className="pt-4">
                <Link
                  href={`/collections/${featuredCollection.slug}`}
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-white hover:bg-[#ccff00] text-black font-bold uppercase text-xs tracking-wider transition-colors"
                >
                  <span>Explore Capsule Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Bestsellers Section */}
      <section className="py-20 bg-[#0c0c0e] border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#ccff00]">
                Street Favorites
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
                Bestsellers
              </h2>
            </div>
            <Link
              href="/shop?filter=bestseller"
              className="mt-4 sm:mt-0 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-[#ccff00] flex items-center gap-1 group"
            >
              <span>View All Bestsellers</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Brand Manifesto & Fabrication */}
      <BrandStory />

      {/* 7. Promotional Delivery Banner */}
      <section className="py-12 bg-gradient-to-r from-zinc-950 via-[#121215] to-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] font-mono text-[#ccff00] uppercase tracking-widest font-bold">
              Bangladesh-Wide Cash On Delivery
            </span>
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
              Dhaka Delivery within 24-48 Hours. Outside Dhaka within 72 Hours.
            </h3>
            <p className="text-xs text-zinc-400">
              No advance payment needed. Inspect package on doorstep before giving cash to courier.
            </p>
          </div>
          <Link
            href="/shop"
            className="flex-shrink-0 px-6 py-3 bg-[#ccff00] hover:bg-[#b8e600] text-black font-semibold uppercase text-xs tracking-wider"
          >
            Shop With COD
          </Link>
        </div>
      </section>

      {/* 8. Customer Reviews (clearly identified sample) */}
      <ReviewsSection />

      {/* 9. VIP Newsletter Sign-up */}
      <NewsletterSection />
    </div>
  );
}
