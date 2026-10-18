-- ==============================================================================
-- FLASHWEAR Phase 3 Migration: Growth, Marketing, Loyalty, Referrals & Retention
-- Additive migration preserving all Phase 1 & Phase 2 tables, records, and policies.
-- ==============================================================================

-- 1. EXTEND ORDERS TABLE WITH LOYALTY & REFERRALS
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS loyalty_points_earned INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT;

-- 2. LOYALTY SETTINGS
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  points_per_100_bdt INT NOT NULL DEFAULT 10,
  point_value_bdt NUMERIC(10, 2) NOT NULL DEFAULT 0.50,
  min_redemption_points INT NOT NULL DEFAULT 100,
  max_redemption_points INT NOT NULL DEFAULT 1000,
  can_combine_with_coupon BOOLEAN NOT NULL DEFAULT false,
  points_expiry_days INT NOT NULL DEFAULT 365,
  qualifying_order_status TEXT NOT NULL DEFAULT 'delivered',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default loyalty settings if absent
INSERT INTO public.loyalty_settings (id, is_active, points_per_100_bdt, point_value_bdt, min_redemption_points, max_redemption_points, can_combine_with_coupon)
VALUES (1, true, 10, 0.50, 100, 1000, false)
ON CONFLICT (id) DO NOTHING;

-- 3. AUDITABLE LOYALTY POINTS LEDGER
CREATE TABLE IF NOT EXISTS public.loyalty_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'order_earned',
    'order_redeemed',
    'order_cancelled_reversal',
    'return_reversal',
    'admin_adjustment',
    'referral_bonus',
    'welcome_bonus'
  )),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user ON public.loyalty_points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_order ON public.loyalty_points_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_created ON public.loyalty_points_ledger(created_at DESC);

-- 4. REFERRAL SETTINGS & REFERRALS LOG
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  referrer_reward_points INT NOT NULL DEFAULT 200,
  referee_discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
  min_qualifying_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
  qualifying_order_status TEXT NOT NULL DEFAULT 'delivered',
  max_referrals_per_user INT NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.referral_settings (id, is_active, referrer_reward_points, referee_discount_amount, min_qualifying_order_amount)
VALUES (1, true, 200, 150.00, 1000.00)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.customer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referee_email TEXT,
  referee_phone TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded', 'reversed', 'blocked')),
  referrer_points_awarded INT NOT NULL DEFAULT 0,
  referee_discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  fraud_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.customer_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.customer_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.customer_referrals(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_order ON public.customer_referrals(order_id);

-- 5. ABANDONED CARTS RECOVERY
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovered', 'expired', 'abandoned')),
  reminder_count INT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  recovered_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  recovered_at TIMESTAMPTZ,
  marketing_consent BOOLEAN NOT NULL DEFAULT true,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_token ON public.abandoned_carts(recovery_token);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON public.abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON public.abandoned_carts(status);

-- 6. BACK-IN-STOCK AND PRICE-DROP SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.stock_price_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('back_in_stock', 'price_drop')),
  target_price NUMERIC(10, 2),
  current_price_at_sub NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'cancelled')),
  notified_at TIMESTAMPTZ,
  unsubscribe_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.stock_price_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product ON public.stock_price_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_variant ON public.stock_price_subscriptions(variant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.stock_price_subscriptions(status);

-- 7. NEWSLETTER SUBSCRIBERS (CONSENT & AUDIENCE)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'storefront_footer',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  consent_given_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.newsletter_subscribers(status);

-- 8. MARKETING CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  content_html TEXT NOT NULL,
  target_segment TEXT NOT NULL DEFAULT 'all_subscribers',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.marketing_campaigns(status);

-- 9. ATOMIC STORED PROCEDURES FOR LOYALTY LEDGER INTEGRITY

-- Procedure: Redeem loyalty points atomically
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points_atomic(
  p_user_id UUID,
  p_points_to_redeem INT,
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INT := 0;
  v_new_balance INT := 0;
  v_ledger_id UUID;
BEGIN
  IF p_points_to_redeem <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points to redeem must be greater than zero');
  END IF;

  -- Lock latest ledger entry for this user to prevent concurrent race condition
  SELECT balance_after INTO v_current_balance
  FROM public.loyalty_points_ledger
  WHERE user_id = p_user_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  IF v_current_balance < p_points_to_redeem THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient points balance: requested %s, available %s', p_points_to_redeem, v_current_balance)
    );
  END IF;

  v_new_balance := v_current_balance - p_points_to_redeem;

  INSERT INTO public.loyalty_points_ledger (
    user_id,
    points,
    balance_after,
    event_type,
    order_id,
    notes
  ) VALUES (
    p_user_id,
    -p_points_to_redeem,
    v_new_balance,
    'order_redeemed',
    p_order_id,
    format('Redeemed %s points on order', p_points_to_redeem)
  )
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'success', true,
    'redeemed_points', p_points_to_redeem,
    'balance_after', v_new_balance,
    'ledger_id', v_ledger_id
  );
END;
$$;

-- Procedure: Award loyalty points atomically
CREATE OR REPLACE FUNCTION public.award_loyalty_points_atomic(
  p_user_id UUID,
  p_points_to_award INT,
  p_order_id UUID,
  p_event_type TEXT,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
  v_current_balance INT := 0;
  v_new_balance INT := 0;
  v_ledger_id UUID;
BEGIN
  IF p_points_to_award <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points to award must be greater than zero');
  END IF;

  -- Check idempotency: order points award can only happen once per order and event_type
  IF p_order_id IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM public.loyalty_points_ledger
    WHERE user_id = p_user_id
      AND order_id = p_order_id
      AND event_type = p_event_type;

    IF FOUND THEN
      RETURN jsonb_build_object('success', true, 'already_awarded', true);
    END IF;
  END IF;

  -- Lock latest ledger entry
  SELECT balance_after INTO v_current_balance
  FROM public.loyalty_points_ledger
  WHERE user_id = p_user_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  v_new_balance := v_current_balance + p_points_to_award;

  INSERT INTO public.loyalty_points_ledger (
    user_id,
    points,
    balance_after,
    event_type,
    order_id,
    notes
  ) VALUES (
    p_user_id,
    p_points_to_award,
    v_new_balance,
    p_event_type,
    p_order_id,
    p_notes
  )
  RETURNING id INTO v_ledger_id;

  -- Update order with earned points
  IF p_order_id IS NOT NULL THEN
    UPDATE public.orders
    SET loyalty_points_earned = p_points_to_award,
        updated_at = NOW()
    WHERE id = p_order_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'awarded_points', p_points_to_award,
    'balance_after', v_new_balance,
    'ledger_id', v_ledger_id
  );
END;
$$;

-- Procedure: Reverse loyalty points atomically on cancellation/refund
CREATE OR REPLACE FUNCTION public.reverse_loyalty_points_atomic(
  p_order_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_earned_entry RECORD;
  v_redeemed_entry RECORD;
  v_current_balance INT := 0;
  v_new_balance INT := 0;
  v_points_to_clawback INT := 0;
  v_points_to_refund INT := 0;
BEGIN
  -- 1. Check if points were earned on this order
  SELECT * INTO v_earned_entry
  FROM public.loyalty_points_ledger
  WHERE order_id = p_order_id AND event_type = 'order_earned'
  LIMIT 1;

  IF FOUND THEN
    v_points_to_clawback := v_earned_entry.points;
    -- Check if already reversed
    PERFORM 1 FROM public.loyalty_points_ledger
    WHERE order_id = p_order_id AND event_type IN ('order_cancelled_reversal', 'return_reversal');

    IF NOT FOUND THEN
      SELECT balance_after INTO v_current_balance
      FROM public.loyalty_points_ledger
      WHERE user_id = v_earned_entry.user_id
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      FOR UPDATE;

      -- Claw back (points >= 0, so reduce balance by min(v_points_to_clawback, current_balance))
      v_new_balance := GREATEST(0, COALESCE(v_current_balance, 0) - v_points_to_clawback);

      INSERT INTO public.loyalty_points_ledger (
        user_id,
        points,
        balance_after,
        event_type,
        order_id,
        notes
      ) VALUES (
        v_earned_entry.user_id,
        -v_points_to_clawback,
        v_new_balance,
        'order_cancelled_reversal',
        p_order_id,
        COALESCE(p_reason, 'Clawed back earned points on cancelled or refunded order')
      );
    END IF;
  END IF;

  -- 2. Check if points were redeemed on this order; if so, refund them back to customer
  SELECT * INTO v_redeemed_entry
  FROM public.loyalty_points_ledger
  WHERE order_id = p_order_id AND event_type = 'order_redeemed'
  LIMIT 1;

  IF FOUND THEN
    v_points_to_refund := ABS(v_redeemed_entry.points);
    -- Check if already refunded
    PERFORM 1 FROM public.loyalty_points_ledger
    WHERE order_id = p_order_id AND event_type = 'admin_adjustment' AND notes LIKE '%Refunded points%';

    IF NOT FOUND THEN
      SELECT balance_after INTO v_current_balance
      FROM public.loyalty_points_ledger
      WHERE user_id = v_redeemed_entry.user_id
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      FOR UPDATE;

      v_new_balance := COALESCE(v_current_balance, 0) + v_points_to_refund;

      INSERT INTO public.loyalty_points_ledger (
        user_id,
        points,
        balance_after,
        event_type,
        order_id,
        notes
      ) VALUES (
        v_redeemed_entry.user_id,
        v_points_to_refund,
        v_new_balance,
        'admin_adjustment',
        p_order_id,
        format('Refunded %s redeemed points due to order cancellation', v_points_to_refund)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'points_clawed_back', v_points_to_clawback,
    'points_refunded', v_points_to_refund
  );
END;
$$;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_price_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Loyalty settings: Anyone can view rules; Admins can edit
CREATE POLICY "Public view loyalty settings" ON public.loyalty_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins manage loyalty settings" ON public.loyalty_settings
  FOR ALL USING (public.is_admin());

-- Loyalty ledger: Users see their own ledger; Admins see all
CREATE POLICY "Users view own loyalty ledger" ON public.loyalty_points_ledger
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage loyalty ledger" ON public.loyalty_points_ledger
  FOR ALL USING (public.is_admin());

-- Referral settings: Anyone can view; Admins manage
CREATE POLICY "Public view referral settings" ON public.referral_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins manage referral settings" ON public.referral_settings
  FOR ALL USING (public.is_admin());

-- Customer referrals: Referrer sees their own referrals; Admins see all
CREATE POLICY "Users view own referrals" ON public.customer_referrals
  FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referee_user_id OR public.is_admin());
CREATE POLICY "Admins manage customer referrals" ON public.customer_referrals
  FOR ALL USING (public.is_admin());

-- Abandoned carts: Only admins or service role can query; users can only recover via token
CREATE POLICY "Admins manage abandoned carts" ON public.abandoned_carts
  FOR ALL USING (public.is_admin());

-- Stock and price subscriptions: Users manage their own; Admins manage all
CREATE POLICY "Users view own subscriptions" ON public.stock_price_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Public create subscriptions" ON public.stock_price_subscriptions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage subscriptions" ON public.stock_price_subscriptions
  FOR ALL USING (public.is_admin());

-- Newsletter subscribers: Public can subscribe; Admins manage; Private to outside
CREATE POLICY "Public subscribe newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers
  FOR ALL USING (public.is_admin());

-- Marketing campaigns: Only admins can view and manage
CREATE POLICY "Admins manage marketing campaigns" ON public.marketing_campaigns
  FOR ALL USING (public.is_admin());
