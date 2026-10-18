import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { Product } from "../types";
import { getAllProducts, getProductById } from "./catalog";
import { fallbackOrders } from "./orders";

export interface RecommendationResult {
  product: Product;
  reason: string;
}

/**
 * Get products frequently purchased in the same orders as the target product
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number = 3
): Promise<RecommendationResult[]> {
  const allProducts = await getAllProducts({ isPublished: true });
  const otherProducts = allProducts.filter((p: Product) => p.id !== productId);

  if (otherProducts.length === 0) return [];

  // Count co-occurrences in orders
  const productFrequency: Record<string, number> = {};

  if (isServiceRoleConfigured()) {
    try {
      // Find order_ids containing this product
      const { data: orderItemRows } = await supabaseAdmin
        .from("order_items")
        .select("order_id")
        .eq("product_id", productId);

      if (orderItemRows && orderItemRows.length > 0) {
        const orderIds = orderItemRows.map((r) => r.order_id);
        const { data: coRows } = await supabaseAdmin
          .from("order_items")
          .select("product_id")
          .in("order_id", orderIds)
          .neq("product_id", productId);

        if (coRows) {
          for (const row of coRows) {
            if (row.product_id) {
              productFrequency[row.product_id] = (productFrequency[row.product_id] || 0) + 1;
            }
          }
        }
      }
    } catch (err) {
      console.warn("DB query frequently bought together error:", err);
    }
  } else {
    // In-memory orders check
    for (const order of fallbackOrders) {
      const hasProduct = order.items?.some((item) => item.product_id === productId);
      if (hasProduct && order.items) {
        for (const item of order.items) {
          if (item.product_id && item.product_id !== productId) {
            productFrequency[item.product_id] = (productFrequency[item.product_id] || 0) + 1;
          }
        }
      }
    }
  }

  const results: RecommendationResult[] = [];

  // Sort by highest co-occurrence
  const sortedIds = Object.entries(productFrequency)
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);

  for (const id of sortedIds) {
    if (results.length >= limit) break;
    const match = otherProducts.find((p: Product) => p.id === id);
    if (match) {
      results.push({
        product: match,
        reason: `Bought together by ${productFrequency[id]} customers`,
      });
    }
  }

  // Graceful fallback to same category if insufficient order history
  if (results.length < limit) {
    const targetProduct = allProducts.find((p: Product) => p.id === productId);
    if (targetProduct?.category_id) {
      const sameCategory = otherProducts.filter(
        (p: Product) => p.category_id === targetProduct.category_id && !results.some((r) => r.product.id === p.id)
      );
      for (const p of sameCategory) {
        if (results.length >= limit) break;
        results.push({
          product: p,
          reason: "Similar style & collection",
        });
      }
    }
  }

  // Fill remainder from general catalog if still sparse
  for (const p of otherProducts) {
    if (results.length >= limit) break;
    if (!results.some((r) => r.product.id === p.id)) {
      results.push({
        product: p,
        reason: "Trending in FLASHWEAR",
      });
    }
  }

  return results.slice(0, limit);
}

/**
 * Get related products by category and collection
 */
export async function getRelatedProducts(
  productId: string,
  categoryId?: string | null,
  collectionId?: string | null,
  limit: number = 4
): Promise<Product[]> {
  const allProducts = await getAllProducts({ isPublished: true });
  const otherProducts = allProducts.filter((p: Product) => p.id !== productId);

  if (otherProducts.length === 0) return [];

  // Priority 1: Same category & same collection
  const sameBoth = otherProducts.filter(
    (p: Product) =>
      Boolean(categoryId && p.category_id === categoryId) &&
      Boolean(collectionId && p.collection_id === collectionId)
  );

  // Priority 2: Same category
  const sameCat = otherProducts.filter(
    (p: Product) => Boolean(categoryId && p.category_id === categoryId) && !sameBoth.includes(p)
  );

  // Priority 3: Same collection
  const sameColl = otherProducts.filter(
    (p: Product) => Boolean(collectionId && p.collection_id === collectionId) && !sameBoth.includes(p) && !sameCat.includes(p)
  );

  const combined = [...sameBoth, ...sameCat, ...sameColl];

  // Fill up with remaining products if fewer than limit
  for (const p of otherProducts) {
    if (combined.length >= limit) break;
    if (!combined.some((item) => item.id === p.id)) {
      combined.push(p);
    }
  }

  return combined.slice(0, limit);
}

/**
 * Get real bestsellers based on order items sales volume
 */
export async function getBestsellers(limit: number = 4): Promise<Product[]> {
  const allProducts = await getAllProducts({ isPublished: true });
  const productSalesCount: Record<string, number> = {};

  if (isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("order_items")
        .select("product_id, quantity");

      if (data) {
        for (const row of data) {
          if (row.product_id) {
            productSalesCount[row.product_id] =
              (productSalesCount[row.product_id] || 0) + (row.quantity || 1);
          }
        }
      }
    } catch {}
  } else {
    for (const o of fallbackOrders) {
      if (o.items) {
        for (const item of o.items) {
          if (item.product_id) {
            productSalesCount[item.product_id] =
              (productSalesCount[item.product_id] || 0) + item.quantity;
          }
        }
      }
    }
  }

  // Sort products by verified sales
  const sorted = [...allProducts].sort((a, b) => {
    const salesA = productSalesCount[a.id] || 0;
    const salesB = productSalesCount[b.id] || 0;
    if (salesB !== salesA) return salesB - salesA;
    // Secondary fallback: is_bestseller flag or is_featured
    if (a.is_bestseller !== b.is_bestseller) return a.is_bestseller ? -1 : 1;
    return a.is_featured ? -1 : 1;
  });

  return sorted.slice(0, limit);
}
