-- FLASHWEAR Non-Destructive Production Catalog Template
-- IMPORTANT: This template is strictly non-destructive.
-- Existing products, variants, active prices, and inventory are NEVER overwritten.
-- Uses ON CONFLICT DO NOTHING to ensure idempotency and prevent catalog data loss.

BEGIN;

-- 1. BASE CATEGORIES (Non-destructive)
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order, is_active)
VALUES
  (gen_random_uuid(), 'Hoodies & Sweats', 'hoodies-sweats', 'Heavyweight French terry hoodies and technical crewnecks.', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80', 1, true),
  (gen_random_uuid(), 'Graphic Tees', 'graphic-tees', '240 GSM drop-shoulder tees featuring bold typography and minimal graphics.', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80', 2, true),
  (gen_random_uuid(), 'Cargo & Pants', 'cargo-pants', 'Utilitarian cargo trousers, tactical joggers, and relaxed denim.', 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80', 3, true),
  (gen_random_uuid(), 'Outerwear & Jackets', 'outerwear', 'Technical windbreakers, bomber jackets, and modular utility vests.', 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80', 4, true),
  (gen_random_uuid(), 'Accessories', 'accessories', 'Tactical cross-body bags, structured caps, and streetwear essentials.', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=80', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. BASE COLLECTIONS (Non-destructive)
INSERT INTO public.collections (id, name, slug, description, image_url, sort_order, is_active)
VALUES
  (gen_random_uuid(), 'Drop 01: Cyber Circuit', 'drop-01-cyber-circuit', 'Inaugural capsule blending brutalist architecture with neon technical accents.', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', 1, true),
  (gen_random_uuid(), 'Monochrome Core', 'monochrome-core', 'Timeless streetwear staples in deep obsidian black, raw ecru, and slate gray.', 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80', 2, true),
  (gen_random_uuid(), 'Tactical Transit', 'tactical-transit', 'Engineered mobility silhouettes with water-resistant ripstop and modular utility pockets.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. PRODUCTION CATALOG INSERTION FUNCTION
-- Safely inserts a production product and its variants without overwriting any existing items
CREATE OR REPLACE FUNCTION public.safe_import_production_product(
  p_name text,
  p_slug text,
  p_description text,
  p_details text,
  p_category_slug text,
  p_collection_slug text,
  p_price numeric,
  p_compare_at_price numeric,
  p_is_published boolean,
  p_is_featured boolean,
  p_is_bestseller boolean,
  p_images jsonb,
  p_variants jsonb
) RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
  v_collection_id uuid;
  v_product_id uuid;
  v_img record;
  v_var record;
BEGIN
  -- Lookup category by slug
  SELECT id INTO v_category_id FROM public.categories WHERE slug = p_category_slug LIMIT 1;
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category slug % not found', p_category_slug;
  END IF;

  -- Lookup collection if provided
  IF p_collection_slug IS NOT NULL THEN
    SELECT id INTO v_collection_id FROM public.collections WHERE slug = p_collection_slug LIMIT 1;
  END IF;

  -- Check if product already exists by slug
  SELECT id INTO v_product_id FROM public.products WHERE slug = p_slug LIMIT 1;

  IF v_product_id IS NOT NULL THEN
    -- Product exists: Do NOT overwrite prices or descriptions
    RETURN v_product_id;
  END IF;

  -- Insert new product
  INSERT INTO public.products (
    name, slug, description, details, category_id, collection_id,
    price, compare_at_price, is_published, is_featured, is_bestseller
  ) VALUES (
    p_name, p_slug, p_description, p_details, v_category_id, v_collection_id,
    p_price, p_compare_at_price, p_is_published, p_is_featured, p_is_bestseller
  ) RETURNING id INTO v_product_id;

  -- Insert product images
  FOR v_img IN SELECT * FROM jsonb_to_recordset(p_images) AS x(url text, alt_text text, sort_order int, is_primary boolean) LOOP
    INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary)
    VALUES (v_product_id, v_img.url, v_img.alt_text, v_img.sort_order, v_img.is_primary);
  END LOOP;

  -- Insert product variants
  FOR v_var IN SELECT * FROM jsonb_to_recordset(p_variants) AS x(sku text, size text, color text, inventory_quantity int) LOOP
    INSERT INTO public.product_variants (product_id, sku, size, color, inventory_quantity)
    VALUES (v_product_id, v_var.sku, v_var.size, v_var.color, v_var.inventory_quantity)
    ON CONFLICT (sku) DO NOTHING;
  END LOOP;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
