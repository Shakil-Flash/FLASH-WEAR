# FLASHWEAR — Production Deployment & Release Guide

## 1. Architecture Overview
FLASHWEAR is an e-commerce platform built with Next.js 14 (App Router), Supabase (PostgreSQL 15, Auth, Storage, and Row-Level Security), and Tailwind CSS.
The platform is designed to run serverless on **Vercel** or containerized via Node.js 20+ LTS.

---

## 2. Pre-Deployment Prerequisites
Before initiating a production release:
1. **GitHub Repository**: Code pushed to `main` branch with passing automated CI checks.
2. **Hosting Provider**: Vercel project connected to the GitHub repository.
3. **Database**: Dedicated production Supabase project (strictly isolated from staging and development).
4. **Merchant Credentials**:
   - SSLCOMMERZ production merchant account (`SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_SANDBOX=false`).
   - Pathao Courier registered merchant account (`PATHAO_CLIENT_ID`, `PATHAO_CLIENT_SECRET`, `PATHAO_STORE_ID`).
   - Resend API key for verified sending domain (`orders@flashwear.store`).
5. **DNS & Custom Domain**:
   - Production domain (`flashwear.store` and `www.flashwear.store`) configured with automated TLS certificate.

---

## 3. Environment Variables Setup
Configure the following in the Vercel Project Settings (Environment Variables, scoped to **Production**):

| Variable | Description | Safe Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment identifier | `production` |
| `NEXT_PUBLIC_SITE_URL` | Canonical store URL | `https://flashwear.store` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase endpoint | `https://<prod-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (Public) | `<prod-anon-key>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role (Server-Only) | `<prod-service-role-key>` |
| `SSLCOMMERZ_STORE_ID` | Production Store ID | `<sslcommerz-live-store-id>` |
| `SSLCOMMERZ_STORE_PASSWORD` | Production Store Password | `<sslcommerz-live-password>` |
| `SSLCOMMERZ_IS_SANDBOX` | Gateway Mode (`false` for live) | `false` |
| `ENABLE_MOCK_PAYMENT_GATEWAY` | Mock Gateway Guard (Never true in prod) | `false` |
| `PATHAO_CLIENT_ID` | Pathao API Client ID | `<pathao-live-client-id>` |
| `PATHAO_CLIENT_SECRET` | Pathao API Secret | `<pathao-live-client-secret>` |
| `PATHAO_USERNAME` | Pathao Courier Username | `logistics@flashwear.store` |
| `PATHAO_PASSWORD` | Pathao Courier Password | `<pathao-live-password>` |
| `PATHAO_STORE_ID` | Pathao Registered Pickup Store ID | `<pathao-store-id>` |
| `PATHAO_IS_SANDBOX` | Pathao Sandbox Mode (`false` for live) | `false` |
| `RESEND_API_KEY` | Resend Transactional Email Key | `re_<live-key>` |
| `STORE_FROM_EMAIL` | Transactional Sender Address | `orders@flashwear.store` |
| `ADMIN_NOTIFICATION_EMAIL` | Admin Alert Recipient | `admin@flashwear.store` |
| `MARKETING_EMAIL_FROM` | Promotional Sender Address | `drops@flashwear.store` |
| `CRON_SECRET` | Secret token for Vercel Cron | `<secure-random-64char-token>` |
| `ADMIN_SECRET_KEY` | Authorization key for `/api/health` diagnostics | `<secure-admin-token>` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_APP_VERSION` | Semantic release version | `1.0.0` |

---

## 4. Production Database Migration Release
Execute migrations sequentially against the target Supabase database:
```bash
# Authenticate Supabase CLI
supabase login

# Link to staging project first to test migrations
supabase link --project-ref <staging-project-ref>
supabase db push

# Run test suite against staging
npm test

# Promote to production project
supabase link --project-ref <production-project-ref>
supabase db push
```

Migration execution sequence:
1. `supabase/migrations/20261017000000_init_flashwear.sql` (Core catalog, orders, cart tables, RLS)
2. `supabase/migrations/20261017000001_phase2_additions.sql` (Addresses, payments, courier consignments, returns)
3. `supabase/migrations/20261017000002_phase3_growth_retention.sql` (Coupons, loyalty points ledger, referrals, marketing campaigns, abandoned carts)
4. `supabase/migrations/20261017000003_phase4_production_hardening.sql` (Composite indexes, job_run_logs, security_audit_logs, hardened RLS)
5. `supabase/migrations/20261018000000_phase7_production_storage_hardening.sql` (Order items RLS, stock_adjustment_audits, atomic procedures for stock and coupons)

> [!CAUTION]
> NEVER run `supabase db reset` on staging or production! It deletes all database tables and executes sample seed scripts. Use `supabase db push` exclusively.

---

## 5. Safe Catalog Import & Production Inventory Setup
To load genuine products, variants, and stock into production without overwriting active records:

### Method A: Automated Safe Import Script
```bash
# 1. Preview changes (Dry run - does not alter database)
node scripts/import-production-catalog.mjs --file ./production-catalog.json --dry-run

# 2. Execute non-destructive import (Preserves existing prices and live inventory)
node scripts/import-production-catalog.mjs --file ./production-catalog.json --confirm
```

### Method B: SQL Function Import
Execute `supabase/catalog-production-safe-import.sql` in the Supabase SQL Editor.
The `public.safe_import_production_product(...)` function guarantees that products and SKUs already in the database are not overwritten.

---

## 6. Domain & DNS Configuration for `flashwear.store`

Configure the following records with your DNS registrar (e.g., Namecheap, Cloudflare, or GoDaddy):

### Storefront Hosting (Vercel)
| Type | Name / Host | Target / Value | TTL | Note |
| :--- | :--- | :--- | :--- | :--- |
| `A` | `@` | `76.76.21.21` | Auto / 300 | Vercel Anycast IP |
| `CNAME` | `www` | `cname.vercel-dns.com.` | Auto / 300 | Canonical redirect |

### Transactional Email Authentication (Resend)
| Type | Name / Host | Target / Value | Priority | Note |
| :--- | :--- | :--- | :--- | :--- |
| `MX` | `bounces` | `feedback-smtp.us-east-1.amazonses.com` | `10` | Return-path |
| `TXT` | `bounces` | `v=spf1 include:amazonses.com ~all` | - | SPF pass for bounces |
| `TXT` | `@` | `v=spf1 include:resend.com ~all` | - | SPF domain authorization |
| `CNAME` | `resend._domainkey` | `dkim.resend.com.` | - | DKIM signature verification |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@flashwear.store` | - | DMARC policy reporting |

---

## 7. Controlled Payment Activation (SSLCOMMERZ)

Maintain `SSLCOMMERZ_IS_SANDBOX=true` until all 5 steps are confirmed:

- [ ] **Step 1: Production Merchant Account**: Obtain Live Store ID and Live Store Password from SSLCOMMERZ Commercial team.
- [ ] **Step 2: IPN Destination Configuration**: In SSLCOMMERZ Merchant Portal (`merchant.sslcommerz.com`), configure IPN listener:
  `https://flashwear.store/api/checkout/ipn`
- [ ] **Step 3: Callback Verification**: Ensure `NEXT_PUBLIC_SITE_URL=https://flashwear.store` is set in Vercel.
- [ ] **Step 4: Real Financial Test**: Conduct a ৳10 test transaction using a personal bKash/Nagad/Visa account.
- [ ] **Step 5: Operator Sign-off**: Switch `SSLCOMMERZ_IS_SANDBOX=false` in Vercel environment variables and redeploy.

---

## 8. Controlled Courier Logistics Activation (Pathao)

Maintain `PATHAO_IS_SANDBOX=true` until verified:

- [ ] **Step 1: Registered Store**: In Pathao Merchant Panel (`merchant.pathao.com`), verify pickup store address and record Store ID.
- [ ] **Step 2: Production Client Credentials**: Obtain OAuth Client ID & Client Secret from Pathao Developer support.
- [ ] **Step 3: Webhook Registration**: In Pathao Developer Console, set webhook URL:
  `https://flashwear.store/api/courier/webhook`
- [ ] **Step 4: Dispatch Verification**: Create a test consignment in sandbox first before toggling `PATHAO_IS_SANDBOX=false`.

---

## 9. Rollback & Disaster Recovery
If an issue occurs after a release:
1. **Instant Rollback**: In Vercel Dashboard -> **Deployments**, select the previous stable deployment and click **Redeploy / Instant Rollback** (`< 30 seconds`).
2. **Database Point-in-Time Recovery**: In Supabase Dashboard -> **Database** -> **Backups**, restore to a timestamp immediately prior to migration.
3. Refer to [BACKUP_AND_DISASTER_RECOVERY.md](file:///e:/FLASH/Flash%20Project/FLASH-WEAR/docs/BACKUP_AND_DISASTER_RECOVERY.md) for full drill instructions.
