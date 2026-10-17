import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/services/catalog";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { ArrowLeft } from "lucide-react";

interface AdminProductEditPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0;

export default async function AdminProductEditPage({ params }: AdminProductEditPageProps) {
  const products = await getProducts();
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-zinc-400 hover:text-white mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Edit: {product.name}
          </h1>
        </div>
      </div>

      <ProductEditForm product={product} />
    </div>
  );
}
