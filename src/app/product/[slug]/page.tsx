import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getProducts } from "@/lib/services/catalog";
import { ProductDetailClient } from "@/components/product/product-detail-client";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage = product.images?.[0]?.url;

  return {
    title: product.name,
    description: product.description,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | FLASHWEAR`,
      description: product.description,
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const relatedProducts = await getProducts({
    categorySlug: product.category?.slug,
    limit: 4,
  });

  // Filter out the current product from related products
  const filteredRelated = relatedProducts.filter((p) => p.id !== product.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flashwear.com.bd";

  // Schema.org structured data for SEO (Product + BreadcrumbList)
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.images?.map((i) => i.url) || [],
      description: product.description,
      sku: product.variants?.[0]?.sku || product.slug,
      brand: {
        "@type": "Brand",
        name: "FLASHWEAR",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: product.price,
        availability:
          product.variants?.some((v) => v.inventory_quantity > 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        url: `${siteUrl}/product/${product.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": product.category?.name || "Shop",
          "item": `${siteUrl}/shop${product.category?.slug ? `?category=${product.category.slug}` : ""}`,
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": `${siteUrl}/product/${product.slug}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} relatedProducts={filteredRelated} />
    </>
  );
}
