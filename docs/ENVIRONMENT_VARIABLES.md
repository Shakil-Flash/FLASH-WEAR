# FLASHWEAR — Environment Variables Reference

This document catalogs every environment variable used in FLASHWEAR across Development, Staging, and Production environments.

## 1. Core Platform & Web Server

### `NODE_ENV`
- **Type**: `"development" | "test" | "production"`
- **Required**: Yes
- **Description**: Dictates runtime mode, error disclosure level, and gateway safety switches.

### `NEXT_PUBLIC_SITE_URL`
- **Type**: URL string
- **Required**: Yes
- **Description**: Canonical root URL used for SEO OpenGraph tags, sitemaps, transactional email links, and SSLCOMMERZ redirection callback targets.
- **Examples**:
  - Dev: `http://localhost:3000`
  - Staging: `https://staging.flashwear.store`
  - Production: `https://flashwear.store`

### `NEXT_PUBLIC_APP_VERSION`
- **Type**: String
- **Default**: `"1.0.0"`
- **Description**: Semantic release identifier displayed in `/api/health` and the Admin Operations dashboard.

---

## 2. Supabase (Database, Auth, Storage)

### `NEXT_PUBLIC_SUPABASE_URL`
- **Type**: URL string
- **Required in Prod**: Yes
- **Visibility**: Public (safe in client bundle)
- **Description**: REST and Auth gateway for your Supabase project.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type**: JWT token string
- **Required in Prod**: Yes
- **Visibility**: Public (safe in client bundle)
- **Description**: Anonymous public key protected by PostgreSQL Row Level Security (RLS) policies.

### `SUPABASE_SERVICE_ROLE_KEY`
- **Type**: JWT token string
- **Required in Prod**: Yes
- **Visibility**: **CRITICAL SECRET — SERVER-SIDE ONLY**
- **Description**: Privileged key bypassing RLS. Used strictly in server-side API routes and server actions for atomic stock updates, administrative order status mutations, and background processing.
- **Rule**: Never prefix with `NEXT_PUBLIC_`. Never import in client components.

---

## 3. Payments (SSLCOMMERZ & Gateway Safety)

### `SSLCOMMERZ_STORE_ID`
- **Type**: String
- **Required for Online Pay**: Yes (COD operates without it)
- **Description**: Merchant store identifier provided by SSLCOMMERZ.

### `SSLCOMMERZ_STORE_PASSWORD`
- **Type**: String
- **Required for Online Pay**: Yes
- **Visibility**: **CRITICAL SECRET — SERVER-SIDE ONLY**
- **Description**: Secret store password used for IPN hash validation and server-to-server transaction validation (`validator/api/validationserverAPI.php`).

### `SSLCOMMERZ_IS_SANDBOX`
- **Type**: `"true" | "false"`
- **Default**: `"true"`
- **Description**: When `"true"`, requests route to `https://sandbox.sslcommerz.com`. In production, set to `"false"` to route to `https://securepay.sslcommerz.com`.

### `ENABLE_MOCK_PAYMENT_GATEWAY`
- **Type**: `"true" | "false"`
- **Default**: `"false"`
- **Description**: Hard safety guard preventing sandbox/mock checkouts in production. In production mode (`NODE_ENV === "production"`), the mock gateway is strictly blocked unless explicitly overridden.

---

## 4. Logistics (Pathao Courier)

### `PATHAO_CLIENT_ID` & `PATHAO_CLIENT_SECRET`
- **Type**: String
- **Visibility**: **SECRET — SERVER-SIDE ONLY**
- **Description**: OAuth credentials from the Pathao Developer Portal.

### `PATHAO_USERNAME` & `PATHAO_PASSWORD`
- **Type**: String
- **Visibility**: **SECRET — SERVER-SIDE ONLY**
- **Description**: Pathao merchant account login used to acquire short-lived bearer tokens for consignment booking.

### `PATHAO_STORE_ID`
- **Type**: String / Number
- **Description**: Pickup hub identifier registered with Pathao.

### `PATHAO_IS_SANDBOX`
- **Type**: `"true" | "false"`
- **Default**: `"true"`
- **Description**: Targets `https://courier-api-sandbox.pathao.com` vs `https://api-hermes.pathao.com`.

---

## 5. Transactional Email & Notifications (Resend)

### `RESEND_API_KEY`
- **Type**: String (`re_...`)
- **Required**: Optional (simulated in-app notifications if omitted)
- **Visibility**: **SECRET — SERVER-SIDE ONLY**

### `STORE_FROM_EMAIL`
- **Type**: Email
- **Default**: `orders@flashwear.store`

### `ADMIN_NOTIFICATION_EMAIL`
- **Type**: Email
- **Default**: `admin@flashwear.store`

### `MARKETING_EMAIL_FROM`
- **Type**: Email
- **Default**: `drops@flashwear.store`

---

## 6. Scheduled Jobs & Cron Security

### `CRON_SECRET`
- **Type**: String
- **Required**: Strongly recommended in production
- **Description**: Secret shared between Vercel Cron and `/api/cron/*` endpoints. Incoming requests must supply `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`.

---

## 7. Observability & Rate Limiting

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Type**: String (`G-XXXXXXXXXX`)
- **Description**: Google Analytics 4 measurement ID for e-commerce tracking.

### `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
- **Type**: URL string
- **Description**: Sentry error monitoring and performance tracing endpoint.

### `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
- **Type**: URL & Token string
- **Description**: Optional distributed Redis backend for multi-instance rate limiting.

### `ADMIN_SECRET_KEY`
- **Type**: String
- **Description**: Test harness administrative secret key for automated staging/CI authorization (`x-admin-key`).
