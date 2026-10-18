-- ==============================================================================
-- FLASHWEAR E-COMMERCE: Phase 4 Production Hardening, Indexes & Reliability
-- Migration: 20261017000003_phase4_production_hardening.sql
-- ==============================================================================

-- 1. High-Concurrency Performance Indexes
-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON public.orders(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Product and inventory lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_prod_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_products_slug_published ON public.products(slug, is_published);
CREATE INDEX IF NOT EXISTS idx_products_category_published ON public.products(category_id, is_published);

-- Customer data lookups
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_default ON public.customer_addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON public.wishlists(user_id, product_id);

-- Marketing, coupons & loyalty lookups
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_user ON public.loyalty_points_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_active ON public.abandoned_carts(reminder_sent, created_at DESC);

-- 2. Background Job Run Logs Table (Observability for scheduled tasks)
CREATE TABLE IF NOT EXISTS public.job_run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'partial')),
    items_processed INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_run_logs_name_started ON public.job_run_logs(job_name, started_at DESC);

-- 3. Security Audit Logs Table (Administrative accountability & tracking)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT,
    actor_email TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_actor ON public.security_audit_logs(actor_id);

-- 4. Enable Row Level Security (RLS) on new operational tables
ALTER TABLE public.job_run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
DROP POLICY IF EXISTS "Service role full access on job_run_logs" ON public.job_run_logs;
CREATE POLICY "Service role full access on job_run_logs"
    ON public.job_run_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on security_audit_logs" ON public.security_audit_logs;
CREATE POLICY "Service role full access on security_audit_logs"
    ON public.security_audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated admin read policy
DROP POLICY IF EXISTS "Admins can read job_run_logs" ON public.job_run_logs;
CREATE POLICY "Admins can read job_run_logs"
    ON public.job_run_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can read security_audit_logs" ON public.security_audit_logs;
CREATE POLICY "Admins can read security_audit_logs"
    ON public.security_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- 5. Hardened User Roles Protection
-- Prevent non-service-role users from writing to user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny public insert on user_roles" ON public.user_roles;
CREATE POLICY "Deny public insert on user_roles"
    ON public.user_roles
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (false);

DROP POLICY IF EXISTS "Deny public update on user_roles" ON public.user_roles;
CREATE POLICY "Deny public update on user_roles"
    ON public.user_roles
    FOR UPDATE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS "Deny public delete on user_roles" ON public.user_roles;
CREATE POLICY "Deny public delete on user_roles"
    ON public.user_roles
    FOR DELETE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS "Service role full access on user_roles" ON public.user_roles;
CREATE POLICY "Service role full access on user_roles"
    ON public.user_roles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Safe read for user checking own role
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
