# FLASHWEAR — Security Review Findings & Hardening Report

## Executive Summary
This document records the comprehensive security audit performed across the FLASHWEAR e-commerce codebase (Phases 1–4) and the remediation measures applied to eliminate critical risks before production launch.

---

## 1. Discovered Vulnerabilities & Remediations

### VULN-01: Broken Object Level Authorization (IDOR) on Customer Accounts
- **Severity**: High (CVSS 7.5)
- **Component**: `/api/account/profile`, `/api/account/addresses`, `/api/account/wishlist`
- **Finding**: Endpoints trusted `userId` sent in query parameters or request bodies (defaulting to `"usr-demo"` in absence), allowing an attacker to read or alter another customer's delivery addresses, saved profile details, or wishlists by manipulating the `userId` parameter.
- **Remediation**: Replaced client-supplied ID parameters with `requireCustomer(request)`. The customer's identity is now resolved strictly from cryptographically verified Supabase SSR session cookies (`auth.user.id`). Any user ID provided by the client in request bodies or query params is discarded.

### VULN-02: Missing Server-Side Authorization on Administrative Mutation Handlers
- **Severity**: Critical (CVSS 9.1)
- **Component**: `/api/admin/reports`, `/api/admin/products`, `/api/admin/inventory`, `/api/admin/settings`, `/api/admin/coupons`, `/api/admin/returns/[id]`, `/api/admin/orders/[id]/ship`, `/api/admin/marketing/*`
- **Finding**: Admin route handlers relied on frontend layout concealment rather than checking credentials at the server boundary. An unauthorized user could craft HTTP requests directly to `/api/admin/reports?format=csv` and download the entire customer order history.
- **Remediation**: Implemented `requireAdmin(request)` across every admin route handler. Unauthorized requests are rejected immediately with HTTP 401 (Unauthorized) or HTTP 403 (Forbidden).

### VULN-03: LocalStorage Admin Authentication Bypass
- **Severity**: High (CVSS 8.2)
- **Component**: `/admin/login`, `/admin/layout.tsx`
- **Finding**: Admin login state was stored in browser `localStorage.setItem("flashwear_admin_logged", "true")`, which is accessible to client scripts and vulnerable to XSS token exfiltration.
- **Remediation**: Migrated admin authentication to server-side HttpOnly cookie `flashwear_admin_session`, issued via `/api/admin/auth` with `Secure`, `SameSite: Lax`, and `HttpOnly` attributes.

### VULN-04: Unrestricted Resource Enumeration & Abuse (Missing Rate Limiting)
- **Severity**: Medium (CVSS 5.3)
- **Component**: `/api/admin/auth`, `/api/checkout`, `/api/coupons/validate`, `/api/newsletter`
- **Finding**: Public endpoints were susceptible to brute-force credential stuffing, coupon code enumeration, checkout inventory denial-of-service, and newsletter form spam.
- **Remediation**: Implemented edge rate limiting in `src/middleware.ts` via sliding window algorithm (`src/lib/rate-limit.ts`) with custom limits:
  - Admin login: 10 attempts per 15 minutes.
  - Checkout placement: 20 requests per 5 minutes.
  - Coupon validation: 30 requests per 5 minutes.
  - Newsletter subscriptions: 10 requests per 10 minutes.
  Excess requests receive HTTP 429 (Too Many Requests) with `Retry-After` headers.

### VULN-05: Missing HTTP Security Headers & Content Security Policy (CSP)
- **Severity**: Medium (CVSS 6.1)
- **Finding**: Absence of CSP allowed potential script injection and clickjacking.
- **Remediation**: Added modern HTTP security headers in `src/middleware.ts`:
  - `Content-Security-Policy`: Restricts scripts, styles, frames, and connections to whitelisted domains (`self`, Supabase, SSLCOMMERZ, Google Analytics, Google Fonts).
  - `X-Frame-Options: DENY` (Clickjacking prevention).
  - `X-Content-Type-Options: nosniff` (MIME confusion prevention).
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` in production.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### VULN-06: Production Mock Payment Gateway Safeguard
- **Severity**: High (CVSS 8.0)
- **Component**: `/api/payments/sslcommerz/mock-gateway`
- **Finding**: In earlier development phases, the mock payment gateway could be invoked to manufacture fake paid orders.
- **Remediation**: Added production gate: if `NODE_ENV === "production"`, the mock payment gateway is strictly locked and returns HTTP 403 unless `ENABLE_MOCK_PAYMENT_GATEWAY="true"` is intentionally provided.

### VULN-07: Sensitive PII & Secret Disclosure in Logs
- **Severity**: Medium (CVSS 5.0)
- **Component**: Application loggers and unhandled error boundaries
- **Finding**: Standard `console.log` could log raw customer phone numbers, passwords, or transaction tokens.
- **Remediation**: Implemented `src/lib/logger.ts` with deep recursive data sanitization (`sanitizeData`), automatically redacting keys matching passwords, secrets, tokens, cards, CVV, and authorization headers. Stack traces are suppressed in production.

---

## 2. Supabase Row Level Security (RLS) Verification
- All public tables have RLS enabled.
- `public.orders`: Public read denied; customer read limited to `customer_id = auth.uid()`; service role has full access.
- `public.customer_addresses`: Customer read/write limited to `user_id = auth.uid()`.
- `public.wishlists`: Customer read/write limited to `user_id = auth.uid()`.
- `public.user_roles`: Public mutations strictly denied; service role only.
- `public.job_run_logs` & `public.security_audit_logs`: Public access denied; service role and verified admins only.
