-- ==============================================================================
-- FLASHWEAR E-COMMERCE: Phase 7 Production Storage Hardening & Concurrency
-- Migration: 20261018000000_phase7_production_storage_hardening.sql
-- ==============================================================================

-- 1. Row Level Security Hardening: Order Items Customer Access
-- Enables authenticated customers to view order items for their own orders
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 2. Persistent Stock Adjustment Audits Table
-- Tracks every manual administrative inventory adjustment permanently in Postgres
CREATE TABLE IF NOT EXISTS public.stock_adjustment_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  difference INT NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_adj_variant ON public.stock_adjustment_audits(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_created ON public.stock_adjustment_audits(created_at DESC);

ALTER TABLE public.stock_adjustment_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage stock adjustment audits" ON public.stock_adjustment_audits;
CREATE POLICY "Admins manage stock adjustment audits" ON public.stock_adjustment_audits
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Service role full access on stock_adjustment_audits" ON public.stock_adjustment_audits;
CREATE POLICY "Service role full access on stock_adjustment_audits" ON public.stock_adjustment_audits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Atomic Stored Procedure: Manual Stock Adjustment with Immediate Audit
CREATE OR REPLACE FUNCTION public.adjust_stock_atomic(
  p_variant_id UUID,
  p_quantity INT,
  p_reason TEXT,
  p_admin_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variant RECORD;
  v_product RECORD;
  v_prev_qty INT;
  v_diff INT;
  v_audit_id UUID;
BEGIN
  IF p_quantity < 0 THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative';
  END IF;

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 3 THEN
    RAISE EXCEPTION 'An authorized reason is required for manual stock adjustments';
  END IF;

  -- Lock variant row for update to prevent concurrent overrides
  SELECT id, product_id, sku, inventory_quantity
  INTO v_variant
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id;
  END IF;

  SELECT name INTO v_product
  FROM public.products
  WHERE id = v_variant.product_id;

  v_prev_qty := v_variant.inventory_quantity;
  v_diff := p_quantity - v_prev_qty;

  -- Update variant stock
  UPDATE public.product_variants
  SET inventory_quantity = p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id;

  -- Record audit trail entry
  INSERT INTO public.stock_adjustment_audits (
    variant_id,
    sku,
    product_name,
    previous_quantity,
    new_quantity,
    difference,
    reason,
    adjusted_by
  ) VALUES (
    p_variant_id,
    v_variant.sku,
    COALESCE(v_product.name, 'Streetwear Item'),
    v_prev_qty,
    p_quantity,
    v_diff,
    TRIM(p_reason),
    COALESCE(p_admin_email, 'admin@flashwear.store')
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object(
    'success', true,
    'audit_id', v_audit_id,
    'variant_id', p_variant_id,
    'sku', v_variant.sku,
    'previous_quantity', v_prev_qty,
    'new_quantity', p_quantity,
    'difference', v_diff
  );
END;
$$;

-- 4. Atomic Stored Procedure: Concurrent Coupon Redemption
-- Guarantees that usage limits and per-customer limits cannot be exceeded under concurrent checkout requests
CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(
  p_coupon_code TEXT,
  p_order_id UUID,
  p_customer_email TEXT,
  p_user_id UUID,
  p_subtotal NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_user_redemptions INT;
  v_discount NUMERIC(12,2) := 0;
BEGIN
  -- 1. Fetch and lock coupon row to serialize concurrent redemptions
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid coupon code');
  END IF;

  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon is inactive');
  END IF;

  IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon promotion has not started yet');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon has expired');
  END IF;

  IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order subtotal does not meet minimum order requirement');
  END IF;

  -- 2. Check overall usage limit under row lock
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon usage limit has been reached');
  END IF;

  -- 3. Check per-customer limit
  IF v_coupon.per_customer_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_redemptions
    FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id
      AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(TRIM(p_customer_email)))
      );

    IF v_user_redemptions >= v_coupon.per_customer_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'You have already reached the redemption limit for this coupon');
    END IF;
  END IF;

  -- 4. Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_subtotal * (v_coupon.discount_value / 100.0));
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
      v_discount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
    IF v_discount > p_subtotal THEN
      v_discount := p_subtotal;
    END IF;
  END IF;

  -- 5. Increment usage count
  UPDATE public.coupons
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = v_coupon.id;

  -- 6. Insert redemption record
  INSERT INTO public.coupon_redemptions (
    coupon_id,
    order_id,
    customer_email,
    user_id,
    discount_amount
  ) VALUES (
    v_coupon.id,
    p_order_id,
    LOWER(TRIM(p_customer_email)),
    p_user_id,
    v_discount
  );

  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_amount', v_discount
  );
END;
$$;
