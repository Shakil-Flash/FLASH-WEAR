# FLASHWEAR — Production Deployment Guide

## 1. Architecture Overview
FLASHWEAR is an e-commerce platform built with Next.js 14 (App Router), Supabase (PostgreSQL 15, Auth, Storage, and Row-Level Security), and Tailwind CSS.
The platform is designed to run serverless on **Vercel** or containerized via Node.js 20 LTS.

---

## 2. Pre-Deployment Prerequisites
Before initiating a production release:
1. **GitHub Repository**: Code pushed to `main` branch with passing CI status.
2. **Hosting Provider**: Vercel project connected to the GitHub repository.
3. **Database**: Dedicated production Supabase project (separate from staging and development).
4. **Merchant Credentials**:
   - SSLCOMMERZ production merchant account (`SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_SANDBOX=false`).
   - Pathao Courier enterprise client credentials.
   - Resend API key for verified sending domain (`orders@flashwear.store`).
5. **DNS & Custom Domain**:
   - Production domain (e.g., `flashwear.store` or `www.flashwear.store`) configured with HTTPS TLS certificate.

---

## 3. Environment Variables Setup
Configure the following in the Vercel Project Settings (Environment Variables, scoped to **Production**):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment identifier | `production` |
| `NEXT_PUBLIC_SITE_URL` | Canonical store URL | `https://flashwear.store` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase endpoint | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (Public) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role (Private) | `eyJhbGciOi...` |
| `SSLCOMMERZ_STORE_ID` | Production Store ID | `flashwearlive` |
| `SSLCOMMERZ_STORE_PASSWORD` | Production Store Password | `LiveSecretPassword` |
| `SSLCOMMERZ_IS_SANDBOX` | Gateway Mode | `false` |
| `ENABLE_MOCK_PAYMENT_GATEWAY` | Mock Gateway Guard | `false` |
| `PATHAO_CLIENT_ID` | Pathao API Client ID | `pt_client_...` |
| `PATHAO_CLIENT_SECRET` | Pathao API Secret | `pt_secret_...` |
| `PATHAO_USERNAME` | Pathao Courier Username | `logistics@flashwear.store` |
| `PATHAO_PASSWORD` | Pathao Courier Password | `SecureCourierPass` |
| `PATHAO_STORE_ID` | Pathao Merchant Store ID | `12345` |
| `PATHAO_IS_SANDBOX` | Pathao Sandbox Mode | `false` |
| `RESEND_API_KEY` | Resend Transactional Email Key | `re_live_...` |
| `CRON_SECRET` | Secret token for Vercel Cron | `flw_cron_sec_...` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_APP_VERSION` | Semantic release version | `1.0.0` |

---

## 4. Production Database Migration Release
Execute migrations sequentially in order against the production Supabase database:
```bash
# Authenticate Supabase CLI
supabase login

# Link to production project
supabase link --project-ref <your-production-project-ref>

# Apply pending migrations safely
supabase db push
```

Migration execution sequence:
1. `supabase/migrations/20261017000000_init_flashwear.sql` (Core catalog, orders, cart tables)
2. `supabase/migrations/20261017000001_phase2_additions.sql` (Addresses, payments, courier consignments, returns)
3. `supabase/migrations/20261017000002_phase3_growth_retention.sql` (Coupons, loyalty points ledger, referrals, marketing campaigns, abandoned carts)
4. `supabase/migrations/20261017000003_phase4_production_hardening.sql` (Composite indexes, job_run_logs, security_audit_logs, hardened RLS)

---

## 5. Storage Buckets & Policies
Ensure the `product-images` bucket exists in Supabase Storage:
- Public visibility: `true` (product catalog media is public)
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/avif`
- Max file upload size: `5MB`
- RLS policy: Public read for all objects; write limited to `service_role` and authenticated admin users.

---

## 6. Vercel Cron Jobs Configuration
Configure `vercel.json` at the root of the project to trigger scheduled tasks:
```json
{
  "crons": [
    {
      "path": "/api/cron/abandoned-carts",
      "schedule": "0 * * * *"
    }
  ]
}
```
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` with each scheduled request.

---

## 7. SSLCOMMERZ Payment Callbacks Setup
In the SSLCOMMERZ Merchant Portal (`merchant.sslcommerz.com`), configure the IPN and webhook destinations:
- **Success URL**: `https://flashwear.store/api/checkout/callback?status=success`
- **Fail URL**: `https://flashwear.store/api/checkout/callback?status=fail`
- **Cancel URL**: `https://flashwear.store/api/checkout/callback?status=cancel`
- **IPN Listener URL**: `https://flashwear.store/api/checkout/ipn`

---

## 8. Pathao Courier Webhook Setup
In the Pathao Courier Developer Portal:
- **Webhook Endpoint**: `https://flashwear.store/api/courier/webhook`
- **Events**: `parcel_delivered`, `parcel_returned`, `parcel_in_transit`, `parcel_cancelled`

---

## 9. Post-Deployment Smoke Verification
Run the verification checklist at `/admin/operations` to ensure:
- Database connectivity latency is `< 100ms`.
- Live payment gateway responds.
- Pathao Courier credentials authenticate.
- Deep health check endpoint `/api/health?type=readiness` returns status `200 healthy`.
