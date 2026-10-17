-- FLASHWEAR E-commerce Database Schema
-- Phase 1: Production-Ready Store Foundation

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER ROLES & PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper function to check if current authenticated user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- 4. COLLECTIONS
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON public.collections(is_active);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- 6. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- 7. PRODUCT VARIANTS (Sizes, Colors, Inventory per variant)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  inventory_quantity INT NOT NULL DEFAULT 0 CHECK (inventory_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- 8. ORDERS (Bangladesh COD Focused)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  order_notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery')),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(12, 2) NOT NULL CHECK (delivery_fee >= 0),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  admin_notes TEXT,
  idempotency_key TEXT UNIQUE,
  receipt_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_receipt_token ON public.orders(receipt_token);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 9. ORDER ITEMS (Preserved snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
  product_image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 10. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'FLASHWEAR',
  contact_email TEXT NOT NULL DEFAULT 'support@flashwear.store',
  contact_phone TEXT NOT NULL DEFAULT '+880 1700-000000',
  dhaka_delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 80.00,
  outside_dhaka_delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 150.00,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  free_shipping_threshold NUMERIC(12, 2) DEFAULT NULL,
  announcement_text TEXT DEFAULT 'FLASHWEAR 2026 DROP 01 // CASH ON DELIVERY AVAILABLE BANGLADESH WIDE',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure default row exists
INSERT INTO public.site_settings (id, store_name, dhaka_delivery_fee, outside_dhaka_delivery_fee, low_stock_threshold)
VALUES (1, 'FLASHWEAR', 80.00, 150.00, 5)
ON CONFLICT (id) DO NOTHING;

-- 11. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read/update their own profile. Admin can view all.
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User roles: Only admin can view or edit roles.
CREATE POLICY "Admins can view and manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Categories: Public read for active categories, admin full access
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Collections: Public read for active collections, admin full access
CREATE POLICY "Public can view active collections" ON public.collections
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage collections" ON public.collections
  FOR ALL USING (public.is_admin());

-- Products: Public read for published products, admin full access
CREATE POLICY "Public can view published products" ON public.products
  FOR SELECT USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (public.is_admin());

-- Product images: Public read, admin full access
CREATE POLICY "Public can view images" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Admins manage product images" ON public.product_images
  FOR ALL USING (public.is_admin());

-- Product variants: Public read, admin full access
CREATE POLICY "Public can view product variants" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Admins manage product variants" ON public.product_variants
  FOR ALL USING (public.is_admin());

-- Orders: Only admins can query all orders. Customers can only read order via receipt token in safe server handler or if admin.
CREATE POLICY "Admins view all orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- Order items: Only admins can view all order items directly.
CREATE POLICY "Admins view all order items" ON public.order_items
  FOR ALL USING (public.is_admin());

-- Site settings: Public can read settings, admin can update
CREATE POLICY "Public can read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins update site settings" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- Newsletter subscribers: Public can insert their email, admin can view
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view newsletter subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (public.is_admin());


-- 13. ATOMIC ORDER CREATION STORED PROCEDURE (Prevents overselling)
CREATE OR REPLACE FUNCTION public.create_guest_order_atomic(
  p_order_number TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_division TEXT,
  p_district TEXT,
  p_delivery_address TEXT,
  p_order_notes TEXT,
  p_subtotal NUMERIC,
  p_delivery_fee NUMERIC,
  p_total_amount NUMERIC,
  p_receipt_token TEXT,
  p_idempotency_key TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_current_stock INT;
  v_product RECORD;
  v_variant RECORD;
  v_calculated_subtotal NUMERIC(12,2) := 0;
  v_existing_order RECORD;
BEGIN
  -- 1. Idempotency check: if order with this idempotency_key already exists, return it safely
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, order_number, receipt_token INTO v_existing_order
    FROM public.orders
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'receipt_token', v_existing_order.receipt_token,
        'is_duplicate', true
      );
    END IF;
  END IF;

  -- 2. Validate and Lock Inventory for each item
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    quantity INT
  )
  LOOP
    -- Lock variant row
    SELECT id, product_id, size, color, sku, inventory_quantity
    INTO v_variant
    FROM public.product_variants
    WHERE id = v_item.variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant with ID % not found', v_item.variant_id;
    END IF;

    IF v_variant.inventory_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (Size: %, Color: %). Available: %, Requested: %',
        v_variant.sku, v_variant.size, v_variant.color, v_variant.inventory_quantity, v_item.quantity;
    END IF;
  END LOOP;

  -- 3. Insert order
  INSERT INTO public.orders (
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    division,
    district,
    delivery_address,
    order_notes,
    payment_method,
    subtotal,
    delivery_fee,
    total_amount,
    status,
    receipt_token,
    idempotency_key
  ) VALUES (
    p_order_number,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_division,
    p_district,
    p_delivery_address,
    p_order_notes,
    'cash_on_delivery',
    p_subtotal,
    p_delivery_fee,
    p_total_amount,
    'pending',
    p_receipt_token,
    p_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- 4. Decrement inventory & insert order items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    product_id UUID,
    product_name TEXT,
    sku TEXT,
    size TEXT,
    color TEXT,
    unit_price NUMERIC,
    quantity INT,
    line_total NUMERIC,
    product_image_url TEXT
  )
  LOOP
    -- Decrement stock safely
    UPDATE public.product_variants
    SET inventory_quantity = inventory_quantity - v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.variant_id;

    -- Insert order item snapshot
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      sku,
      size,
      color,
      unit_price,
      quantity,
      line_total,
      product_image_url
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.variant_id,
      v_item.product_name,
      v_item.sku,
      v_item.size,
      v_item.color,
      v_item.unit_price,
      v_item.quantity,
      v_item.line_total,
      v_item.product_image_url
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number,
    'receipt_token', p_receipt_token,
    'is_duplicate', false
  );
END;
$$;

-- 14. ATOMIC ORDER CANCELLATION & STOCK RESTORATION
CREATE OR REPLACE FUNCTION public.cancel_order_and_restore_stock(
  p_order_id UUID,
  p_admin_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can cancel orders';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Order is already cancelled';
  END IF;

  -- Restore stock for items that have a variant_id
  FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET inventory_quantity = inventory_quantity + v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.variant_id;
    END IF;
  END LOOP;

  -- Update order status
  UPDATE public.orders
  SET status = 'cancelled',
      admin_notes = COALESCE(admin_notes || E'\n' || p_admin_notes, p_admin_notes),
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'cancelled'
  );
END;
$$;
