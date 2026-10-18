-- ==============================================================================
-- FLASHWEAR Phase 2 Migration: Payments, Courier, Accounts, Coupons & Returns
-- Additive migration preserving all Phase 1 tables, records, and relationships.
-- ==============================================================================

-- 1. EXTEND ORDERS TABLE
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS coupon_id UUID,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS courier_name TEXT,
  ADD COLUMN IF NOT EXISTS courier_consignment_id TEXT,
  ADD COLUMN IF NOT EXISTS courier_tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS shipment_status TEXT NOT NULL DEFAULT 'not_shipped';

-- Update payment_method constraint to allow online payment (sslcommerz)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cash_on_delivery', 'sslcommerz'));

-- Ensure payment_status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'cancelled', 'refund_pending', 'partially_refunded', 'refunded'));

-- Ensure shipment_status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shipment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_shipment_status_check 
  CHECK (shipment_status IN ('not_shipped', 'shipment_requested', 'accepted_by_courier', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed', 'returned_to_sender', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_status ON public.orders(shipment_status);
CREATE INDEX IF NOT EXISTS idx_orders_courier_consignment ON public.orders(courier_consignment_id);

-- 2. PAYMENT TRANSACTIONS (SSLCOMMERZ & Gateway Logs)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'sslcommerz',
  tran_id TEXT UNIQUE NOT NULL,
  val_id TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL CHECK (status IN ('initiated', 'pending', 'validated', 'failed', 'cancelled', 'refunded')),
  card_type TEXT,
  bank_tran_id TEXT,
  card_brand TEXT,
  card_issuer TEXT,
  raw_response JSONB,
  error_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tran_id ON public.payment_transactions(tran_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_val_id ON public.payment_transactions(val_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- 3. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC(12, 2) CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  per_customer_limit INT NOT NULL DEFAULT 1 CHECK (per_customer_limit > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

-- 4. COUPON REDEMPTIONS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coupon_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order_id ON public.coupon_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_customer_email ON public.coupon_redemptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions(user_id);

-- 5. CUSTOMER ADDRESS BOOK
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  address_line TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);

-- 6. CUSTOMER WISHLIST
CREATE TABLE IF NOT EXISTS public.customer_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_wishlist_user_id ON public.customer_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_product_id ON public.customer_wishlist(product_id);

-- 7. RETURN & EXCHANGE REQUESTS
CREATE TABLE IF NOT EXISTS public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('return', 'exchange')),
  items JSONB NOT NULL,
  reason TEXT NOT NULL,
  customer_notes TEXT,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'return_in_transit', 'received', 'inspected', 'completed', 'cancelled')),
  inspection_outcome TEXT,
  is_restocked BOOLEAN NOT NULL DEFAULT false,
  refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (refund_amount >= 0),
  refund_status TEXT NOT NULL DEFAULT 'unrefunded' CHECK (refund_status IN ('unrefunded', 'pending', 'processed', 'declined')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order_number ON public.return_requests(order_number);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON public.return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests(status);

-- 8. SHIPMENTS LOG
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_name TEXT NOT NULL,
  consignment_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  status TEXT NOT NULL DEFAULT 'shipment_requested',
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cod_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  courier_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_consignment_id ON public.shipments(consignment_id);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES FOR PHASE 2 TABLES

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Payment Transactions: Admin only (customers never access raw payment transaction records)
CREATE POLICY "Admins manage payment transactions" ON public.payment_transactions
  FOR ALL USING (public.is_admin());

-- Coupons: Public can view active coupons to validate at checkout; Admins manage all
CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

-- Coupon redemptions: Admins full access; users can view their own redemptions
CREATE POLICY "Users can view own redemptions" ON public.coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage coupon redemptions" ON public.coupon_redemptions
  FOR ALL USING (public.is_admin());

-- Customer Addresses: Users manage their own addresses; Admins can view
CREATE POLICY "Users manage own addresses" ON public.customer_addresses
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Wishlist: Users manage their own wishlist
CREATE POLICY "Users manage own wishlist" ON public.customer_wishlist
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Return Requests: Users can view their own requests and create new ones; Admins manage all
CREATE POLICY "Users view own return requests" ON public.return_requests
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users create return requests" ON public.return_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

CREATE POLICY "Admins manage return requests" ON public.return_requests
  FOR ALL USING (public.is_admin());

-- Shipments: Admins manage shipments; users can view if related to their order
CREATE POLICY "Admins manage shipments" ON public.shipments
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users view own shipments" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Update Orders RLS: allow authenticated users to view their own orders
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 10. ATOMIC PROCEDURES FOR PHASE 2

-- Procedure: Update order payment status and record transaction idempotently
CREATE OR REPLACE FUNCTION public.process_payment_verification_atomic(
  p_order_id UUID,
  p_gateway TEXT,
  p_tran_id TEXT,
  p_val_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_status TEXT,
  p_card_type TEXT,
  p_bank_tran_id TEXT,
  p_card_brand TEXT,
  p_card_issuer TEXT,
  p_raw_response JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_existing_tx RECORD;
  v_new_payment_status TEXT;
  v_new_order_status TEXT;
BEGIN
  -- 1. Check existing transaction to ensure idempotency
  SELECT id, status INTO v_existing_tx
  FROM public.payment_transactions
  WHERE tran_id = p_tran_id;

  IF FOUND AND v_existing_tx.status = 'validated' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'status', 'validated',
      'message', 'Transaction already validated'
    );
  END IF;

  -- 2. Fetch and lock order
  SELECT id, order_number, total_amount, payment_status, status
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order with ID % not found', p_order_id;
  END IF;

  -- 3. Determine new statuses
  IF p_status = 'validated' THEN
    v_new_payment_status := 'paid';
    -- Move order to confirmed if it was pending
    v_new_order_status := CASE WHEN v_order.status = 'pending' THEN 'confirmed' ELSE v_order.status END;
  ELSIF p_status = 'failed' THEN
    v_new_payment_status := 'failed';
    v_new_order_status := v_order.status;
  ELSIF p_status = 'cancelled' THEN
    v_new_payment_status := 'cancelled';
    v_new_order_status := v_order.status;
  ELSE
    v_new_payment_status := 'pending';
    v_new_order_status := v_order.status;
  END IF;

  -- 4. Update order payment and status
  UPDATE public.orders
  SET payment_status = v_new_payment_status,
      status = v_new_order_status,
      updated_at = NOW()
  WHERE id = p_order_id;

  -- 5. Insert or update payment transaction record
  INSERT INTO public.payment_transactions (
    order_id,
    gateway,
    tran_id,
    val_id,
    amount,
    currency,
    status,
    card_type,
    bank_tran_id,
    card_brand,
    card_issuer,
    raw_response,
    updated_at
  ) VALUES (
    p_order_id,
    p_gateway,
    p_tran_id,
    p_val_id,
    p_amount,
    p_currency,
    p_status,
    p_card_type,
    p_bank_tran_id,
    p_card_brand,
    p_card_issuer,
    p_raw_response,
    NOW()
  )
  ON CONFLICT (tran_id) DO UPDATE SET
    val_id = EXCLUDED.val_id,
    status = EXCLUDED.status,
    bank_tran_id = EXCLUDED.bank_tran_id,
    raw_response = EXCLUDED.raw_response,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'payment_status', v_new_payment_status,
    'order_status', v_new_order_status
  );
END;
$$;

-- Procedure: Restock returned items (only upon admin inspection and approval)
CREATE OR REPLACE FUNCTION public.restock_returned_items_atomic(
  p_return_id UUID,
  p_admin_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_return RECORD;
  v_item RECORD;
BEGIN
  -- 1. Fetch return request
  SELECT * INTO v_return
  FROM public.return_requests
  WHERE id = p_return_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return request % not found', p_return_id;
  END IF;

  IF v_return.is_restocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Items have already been restocked');
  END IF;

  IF v_return.status NOT IN ('received', 'inspected', 'completed') THEN
    RAISE EXCEPTION 'Cannot restock items before physical goods are received and inspected';
  END IF;

  -- 2. Restock each eligible item in variant inventory
  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_return.items) AS x(
    variant_id UUID,
    quantity INT
  )
  LOOP
    IF v_item.variant_id IS NOT NULL AND v_item.quantity > 0 THEN
      UPDATE public.product_variants
      SET inventory_quantity = inventory_quantity + v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.variant_id;
    END IF;
  END LOOP;

  -- 3. Mark return request as restocked
  UPDATE public.return_requests
  SET is_restocked = true,
      admin_notes = COALESCE(admin_notes || E'\n' || p_admin_notes, p_admin_notes),
      updated_at = NOW()
  WHERE id = p_return_id;

  RETURN jsonb_build_object('success', true, 'return_id', p_return_id, 'is_restocked', true);
END;
$$;

-- Seed initial test coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, is_active)
VALUES 
  ('FLASH10', '10% off on all streetwear orders above ৳1,000', 'percentage', 10.00, 1000.00, 500.00, 500, true),
  ('WELCOME200', '৳200 flat discount on orders above ৳2,000', 'fixed', 200.00, 2000.00, NULL, 1000, true),
  ('VIP500', '৳500 flat discount for VIP club members on orders above ৳4,000', 'fixed', 500.00, 4000.00, NULL, 100, true)
ON CONFLICT (code) DO NOTHING;
