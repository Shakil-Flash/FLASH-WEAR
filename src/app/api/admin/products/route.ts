import { NextResponse } from "next/server";
import { supabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { INITIAL_PRODUCTS } from "@/lib/data/mock-catalog";
import { Product } from "@/lib/types";
import { requireAdmin } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      details,
      price,
      compareAtPrice,
      categoryId,
      collectionId,
      isPublished,
      isFeatured,
      isBestseller,
      images,
      variants,
    } = body;

    if (!name || !slug || !price) {
      return NextResponse.json({ error: "Name, slug, and price are required." }, { status: 400 });
    }

    if (isServiceRoleConfigured()) {
      // Insert product
      const { data: newProd, error: pError } = await supabaseAdmin
        .from("products")
        .insert({
          name,
          slug,
          description: description || "",
          details: details || null,
          price,
          compare_at_price: compareAtPrice || null,
          category_id: categoryId || null,
          collection_id: collectionId || null,
          is_published: isPublished ?? true,
          is_featured: isFeatured ?? false,
          is_bestseller: isBestseller ?? false,
        })
        .select()
        .single();

      if (pError) {
        return NextResponse.json({ error: pError.message }, { status: 400 });
      }

      // Insert images
      if (images && images.length > 0) {
        const imageRows = images.map((img: string, idx: number) => ({
          product_id: newProd.id,
          url: img,
          sort_order: idx,
        }));
        await supabaseAdmin.from("product_images").insert(imageRows);
      }

      // Insert variants
      if (variants && variants.length > 0) {
        const variantRows = variants.map((v: any) => ({
          product_id: newProd.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          inventory_quantity: v.quantity || 0,
        }));
        await supabaseAdmin.from("product_variants").insert(variantRows);
      }

      return NextResponse.json({ success: true, product: newProd });
    }

    // Fallback store
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name,
      slug,
      description: description || "",
      details: details || null,
      price: Number(price),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      category_id: categoryId || null,
      collection_id: collectionId || null,
      is_published: isPublished ?? true,
      is_featured: isFeatured ?? false,
      is_bestseller: isBestseller ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: (images || []).map((url: string, i: number) => ({
        id: `img-${Date.now()}-${i}`,
        product_id: `p-${Date.now()}`,
        url,
        alt_text: name,
        sort_order: i,
        created_at: "",
      })),
      variants: (variants || []).map((v: any, i: number) => ({
        id: `var-${Date.now()}-${i}`,
        product_id: `p-${Date.now()}`,
        size: v.size,
        color: v.color,
        sku: v.sku,
        inventory_quantity: Number(v.quantity || 0),
        created_at: "",
        updated_at: "",
      })),
    };

    INITIAL_PRODUCTS.unshift(newProduct);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const body = await request.json();
    const { id, name, price, compareAtPrice, isPublished, isFeatured, isBestseller, description, details } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    if (isServiceRoleConfigured()) {
      const { error } = await supabaseAdmin
        .from("products")
        .update({
          name,
          price,
          compare_at_price: compareAtPrice || null,
          is_published: isPublished,
          is_featured: isFeatured,
          is_bestseller: isBestseller,
          description,
          details,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    const prod = INITIAL_PRODUCTS.find((p) => p.id === id);
    if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    if (name) prod.name = name;
    if (price !== undefined) prod.price = Number(price);
    if (compareAtPrice !== undefined) prod.compare_at_price = compareAtPrice ? Number(compareAtPrice) : null;
    if (isPublished !== undefined) prod.is_published = isPublished;
    if (isFeatured !== undefined) prod.is_featured = isFeatured;
    if (isBestseller !== undefined) prod.is_bestseller = isBestseller;
    if (description !== undefined) prod.description = description;
    if (details !== undefined) prod.details = details;
    prod.updated_at = new Date().toISOString();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
