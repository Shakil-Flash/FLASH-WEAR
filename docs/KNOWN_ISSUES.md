# FLASHWEAR — Known Issues, Blockers & External Integration Prerequisites

This document candidly outlines external credentials, merchant approvals, and cloud services required before opening the live production store to real paying traffic.

## 1. External Merchant Account Prerequisites

### A. SSLCOMMERZ Live Merchant Account
- **Current Status**: Local development and staging run against SSLCOMMERZ Sandbox or high-fidelity simulated test harness.
- **Production Prerequisite**:
  - Requires approved SSLCOMMERZ Live Store ID and Live Store Password.
  - SSLCOMMERZ integration team must whitelist the production domain (`flashwear.store`) and register IPN listener URL:
    `https://flashwear.store/api/payments/sslcommerz/ipn`.
  - In production environment: Set `SSLCOMMERZ_IS_SANDBOX=false` and `ENABLE_MOCK_PAYMENT_GATEWAY=false`.
- **Blocker Level**: Pre-launch blocker for online card/MFS payments. Cash on Delivery (COD) can launch independently.

### B. Pathao Courier Merchant Account & Pickup Hub
- **Current Status**: Operates with automated simulated consignment tracking and manual courier dispatch fallback mode.
- **Production Prerequisite**:
  - Requires approved Pathao Courier enterprise client account.
  - Client ID, Client Secret, Username, Password, and Store/Hub ID must be added to Vercel environment variables.
  - Set `PATHAO_IS_SANDBOX=false`.
- **Blocker Level**: Non-blocking (Manual consignment dispatch works seamlessly out of the box).

### C. Resend Transactional Email Domain Verification
- **Current Status**: Emails run in simulated mode, logging cleanly to server logs and generating mock in-app delivery events.
- **Production Prerequisite**:
  - Add DNS TXT (SPF) and CNAME (DKIM) records to `flashwear.store` DNS manager.
  - Verify domain in Resend Dashboard.
  - Add `RESEND_API_KEY` to Vercel environment variables.
- **Blocker Level**: Non-blocking (Customers still receive on-screen confirmation and order tracking numbers).

---

## 2. Platform Infrastructure Setup

### A. Dedicated Production Supabase Project
- **Current Status**: Codebase includes complete additive SQL migrations (`00` through `03`).
- **Production Prerequisite**:
  - Create separate dedicated production Supabase project (do not reuse development/staging database).
  - Apply migrations: `supabase db push`.
  - Seed initial admin user and assign `'admin'` role in `public.user_roles`.
  - Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Vercel production environment.

### B. Vercel Cron Scheduling
- **Current Status**: Cron route `/api/cron/abandoned-carts` implemented with `CRON_SECRET` bearer token validation.
- **Production Prerequisite**:
  - Deploy to Vercel with `CRON_SECRET` configured in environment settings.
  - Verify cron execution logs in Vercel Dashboard -> **Cron Jobs**.

---

## 3. Go / No-Go Decision Framework
- **Stage 1: Internal Staging** -> **GO** (Ready immediately). Full functionality testable with mock/sandbox services.
- **Stage 2: Soft Launch / Beta (COD Only)** -> **GO** (Ready immediately upon provisioning production Supabase and domain).
- **Stage 3: Full Public Launch (Online Payments & Automated Logistics)** -> **PENDING MERCHANT CREDENTIALS** (Awaiting SSLCOMMERZ live merchant activation and Pathao API keys).
