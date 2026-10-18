import { supabase, isSupabaseConfigured } from "../supabase/client";
import { INITIAL_CATEGORIES, INITIAL_COLLECTIONS, INITIAL_PRODUCTS, INITIAL_SETTINGS } from "../data/mock-catalog";
import { Category, Collection, Product, SiteSettings } from "../types";

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!error && data) {
        return data as Category[];
      }
    } catch {
      // Fallback
    }
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  return INITIAL_CATEGORIES;
}

export async function getCollections(): Promise<Collection[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!error && data) {
        return data as Collection[];
      }
    } catch {
      // Fallback
    }
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  return INITIAL_COLLECTIONS;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (!error && data) {
        return data as SiteSettings;
      }
    } catch {
      // Fallback
    }
  }
  return INITIAL_SETTINGS;
}

export interface ProductFilters {
  categorySlug?: string;
  collectionSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "popularity";
  featured?: boolean;
  bestseller?: boolean;
  size?: string;
  color?: string;
  limit?: number;
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq("is_published", true);

      if (filters.featured) {
        query = query.eq("is_featured", true);
      }
      if (filters.bestseller) {
        query = query.eq("is_bestseller", true);
      }
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters.sort === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (filters.sort === "price_desc") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (!error && data) {
        let results = data as Product[];
        if (filters.categorySlug) {
          results = results.filter((p) => p.category?.slug === filters.categorySlug);
        }
        if (filters.collectionSlug) {
          results = results.filter((p) => p.collection?.slug === filters.collectionSlug);
        }
        if (filters.size) {
          results = results.filter((p) => p.variants?.some((v) => v.size.toLowerCase() === filters.size?.toLowerCase()));
        }
        if (filters.color) {
          results = results.filter((p) => p.variants?.some((v) => v.color.toLowerCase() === filters.color?.toLowerCase()));
        }
        return results;
      }
    } catch {
      // Fallback
    }
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  // Filter against mock catalog
  let items = [...INITIAL_PRODUCTS];

  if (filters.featured) {
    items = items.filter((p) => p.is_featured);
  }
  if (filters.bestseller) {
    items = items.filter((p) => p.is_bestseller);
  }
  if (filters.categorySlug) {
    const cat = INITIAL_CATEGORIES.find((c) => c.slug === filters.categorySlug);
    if (cat) {
      items = items.filter((p) => p.category_id === cat.id);
    }
  }
  if (filters.collectionSlug) {
    const col = INITIAL_COLLECTIONS.find((c) => c.slug === filters.collectionSlug);
    if (col) {
      items = items.filter((p) => p.collection_id === col.id);
    }
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s)
    );
  }
  if (filters.minPrice !== undefined) {
    items = items.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    items = items.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.size) {
    items = items.filter((p) =>
      p.variants?.some((v) => v.size.toLowerCase() === filters.size?.toLowerCase())
    );
  }
  if (filters.color) {
    items = items.filter((p) =>
      p.variants?.some((v) => v.color.toLowerCase() === filters.color?.toLowerCase())
    );
  }

  if (filters.sort === "price_asc") {
    items.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "price_desc") {
    items.sort((a, b) => b.price - a.price);
  }

  if (filters.limit) {
    items = items.slice(0, filters.limit);
  }

  // Attach category and collection references
  return items.map((product) => ({
    ...product,
    category: INITIAL_CATEGORIES.find((c) => c.id === product.category_id) || null,
    collection: INITIAL_COLLECTIONS.find((c) => c.id === product.collection_id) || null,
  }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (!error && data) {
        return data as Product;
      }
    } catch {
      // Fallback
    }

    // In database-configured environments, if product does not exist in DB, do not fabricate from mock
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const found = INITIAL_PRODUCTS.find((p) => p.slug === slug);
  if (!found) return null;

  return {
    ...found,
    category: INITIAL_CATEGORIES.find((c) => c.id === found.category_id) || null,
    collection: INITIAL_COLLECTIONS.find((c) => c.id === found.collection_id) || null,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        return data as Product;
      }
    } catch {}

    // In database-configured environments, if product does not exist in DB, do not fabricate from mock
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const found = INITIAL_PRODUCTS.find((p) => p.id === id);
  if (!found) return null;

  return {
    ...found,
    category: INITIAL_CATEGORIES.find((c) => c.id === found.category_id) || null,
    collection: INITIAL_COLLECTIONS.find((c) => c.id === found.collection_id) || null,
  };
}

export async function getAllProducts(filters?: ProductFilters & { isPublished?: boolean }): Promise<Product[]> {
  return getProducts(filters);
}

