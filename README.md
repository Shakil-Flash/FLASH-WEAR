# FLASHWEAR — Production-Ready Streetwear E-Commerce Platform

**FLASHWEAR** is a contemporary, bold, and architectural apparel e-commerce web platform engineered for Bangladesh. Built with **Next.js 14 (App Router)**, **TypeScript (Strict Mode)**, **Tailwind CSS**, **Supabase (PostgreSQL with RLS)**, and **Zod**.

All four engineering phases (Phase 1: Foundation, Phase 2: Operations & Payments, Phase 3: Growth & Retention, Phase 4: Production Launch, Security, Reliability & Scalability) are fully implemented, audited, and tested.

---

## Phase 4: Production Launch, DevSecOps & Reliability

### Key Deliverables Completed:
1. **Server-Side Security & Authorization**:
   - Zero-trust server authorization via `requireAdmin(request)` across every administrative mutation and report handler.
   - Elimination of IDOR vulnerabilities on customer profiles, addresses, and wishlists via `requireCustomer(request)` bound to Supabase SSR session tokens.
   - HttpOnly `flashwear_admin_session` cookies replacing client `localStorage`.
2. **Next.js Middleware & Request Protection (`src/middleware.ts`)**:
   - Strict Content Security Policy (CSP), HSTS (production), X-Frame-Options (DENY), nosniff, and Referrer-Policy.
   - Sliding-window edge rate limiting on checkout, admin auth, coupons, and newsletter signups.
   - Background cron endpoint authorization (`CRON_SECRET` bearer token validation).
3. **Observability, Health & Structured Logging**:
   - Deep readiness and liveness telemetry endpoint (`/api/health?type=readiness`).
   - Machine-readable structured logger (`src/lib/logger.ts`) with automatic recursive PII and credential scrubbing.
   - Root error boundary (`src/app/error.tsx`) redacting internal server traces in production.
4. **Admin Operations Hub (`/admin/operations`)**:
   - Real-time dependency status (PostgreSQL latency, SSLCOMMERZ gateway mode, Pathao logistics, Resend email).
   - Manual background job dispatch and replay controls.
   - Release Go/No-Go checklist and direct links to operational runbooks.
5. **Database Production Hardening**:
   - Migration `20261017000003_phase4_production_hardening.sql` with composite high-concurrency indexes.
   - `job_run_logs` and `security_audit_logs` tables with restrictive RLS policies.
   - User roles privilege escalation denial policies.
6. **CI/CD Quality Gates & Automation**:
   - GitHub Actions CI workflow (`.github/workflows/ci.yml`) executing lint, typecheck, 51-test Vitest suite, migration validation, and Next.js production build.
   - Deployment pipeline (`.github/workflows/deploy.yml`) with staging/production environment separation.
7. **Comprehensive Operational Documentation (`docs/`)**:
   - 12 comprehensive, tailored guides covering deployment, incident response, rollback, migrations, backups, and troubleshooting.

## 1. Features Implemented in Phase 2

### A. Online Payments with SSLCOMMERZ
- **Hosted Checkout**: Seamless customer redirection to the SSLCOMMERZ hosted gateway.
- **Dual Payment Methods**: Customers can pick between **Cash on Delivery (COD)** and **Online Payment (SSLCOMMERZ)** on `/checkout`.
- **Server-Side Verification**:
  - Independent server-to-server query to SSLCOMMERZ Validation API (`/validator/api/validationserverAPI.php`).
  - Validation of `val_id`, matching transaction ID (`tran_id`), matching order total amount, and strict BDT currency checks.
  - Browser success callback treated as untrusted until confirmed server-side.
- **Idempotency & IPN**:
  - Instant Payment Notification (IPN) webhook handler (`/api/payments/sslcommerz/ipn`) with idempotent database updates.
  - Duplicate callbacks do not cause duplicate order confirmations or double inventory deductions.
- **Controlled Payment States**:
  - `unpaid` → `pending` → `paid` / `failed` / `cancelled` / `refunded`.
- **Safe Inventory Reservation & Retries**:
  - Stock is reserved when an online checkout begins.
  - If a transaction is cancelled, stock is atomically released.
  - If a payment fails, customer can retry payment safely without decrementing stock a second time.
- **Interactive Sandbox Mock Harness**:
  - High-fidelity built-in simulator at `/api/payments/sslcommerz/mock-gateway` allows simulating Success, Failure, and Cancellation without real credit cards or bank accounts.

### B. Courier Integration & Delivery Tracking
- **Unified Courier Abstraction**: Reusable `ICourierProvider` interface with automatic dispatch and duplicate prevention.
- **Pathao Courier Adapter (`PathaoCourierAdapter`)**:
  - Aladdin Courier API integration with OAuth token issuance and parcel booking.
  - Direct tracking URLs (`https://pathao.com/courier/tracking/?consignment_id={id}`).
- **Manual Courier Adapter (`ManualCourierAdapter`)**:
  - Fallback and alternative courier tracking for Steadfast, RedX, Sundarban, and custom carriers.
- **Admin Shipping Workflow (`/admin/orders/[id]`)**:
  - One-click dispatch with configured courier partner.
  - Automatic consignment number generation and tracking link storage.
  - Protection against accidental double-clicks or repeated dispatch requests.

### C. Customer Registration & Account Dashboard
- **Customer Portal Suite (`/account`)**:
  - `/account`: Member overview, total order count, saved addresses summary.
  - `/account/login`: Email and password authentication with demo session support.
  - `/account/register`: Member registration with name, email, phone, and password.
  - `/account/orders`: Comprehensive order history with payment status and fulfillment badges.
  - `/account/orders/[orderNumber]`: Order details, live 4-stage tracking progress bar, item snapshots, courier tracking links, and "Request Return / Exchange" action.
  - `/account/addresses`: Saved delivery address book with add, remove, and default toggling.
  - `/account/wishlist`: Saved streetwear items with instant view and remove controls.
  - `/account/profile`: Contact details editing and password reset links.
- **Strict Ownership Security**:
  - Authenticated customers can view only their own orders (`user_id = auth.uid()`).
  - Guest orders accessible only through secret `receipt_token` query parameters; guessing an order number alone returns 404.

### D. Discount & Coupon Engine
- **Database-Backed Rules**:
  - Percentage discounts (with optional maximum discount cap in BDT).
  - Fixed-amount discounts (in BDT).
  - Minimum order amount requirements.
  - Expiry dates and activation toggles.
  - Global usage ceilings and per-customer redemption limits.
- **Live Cart & Checkout Integration**:
  - Promotional coupon box in both `/cart` and `/checkout`.
  - Server-side validation via `/api/coupons/validate`. Prices and discount deductions are always re-calculated on the server.
- **Admin Management (`/admin/discounts`, `/admin/discounts/new`)**:
  - Create and configure new promo codes.
  - View usage counts and toggle active/disabled status.

### E. Customer Returns & Exchanges
- **Customer Request Workflow**:
  - Accessible directly on `/account/orders/[orderNumber]`.
  - Select specific order items and quantities.
  - Choose between **Return for Refund** or **Size/Color Exchange** (with target exchange size).
  - Select reason, add customer notes, and submit.
- **Admin Returns Portal (`/admin/returns`, `/admin/returns/[id]`)**:
  - Review incoming return requests with status filtering.
  - Record QA inspection outcome (e.g., Passed Inspection, Stained/Worn, Missing Tags).
  - Record refund amount and refund processing status (`unrefunded`, `pending`, `processed`, `declined`).
- **Inventory Restock Safeguard**:
  - Stock is **never** restored upon mere return request creation.
  - Restocking is gated behind physical warehouse arrival and QA inspection approval via the "Approve Restock into Inventory" trigger.

### F. Sales Reports & Operational Analytics
- **Live Admin Dashboard (`/admin/reports`)**:
  - **Net Sales (Realized)**: `Payments Received - Refunds Completed`.
  - **Payments Received**: Sum of verified SSLCOMMERZ online paid orders + delivered COD orders.
  - **Gross Order Value**: Sum of all placed orders.
  - **Discounts Granted**: Cumulative coupon deductions.
  - **Orders by Fulfillment Status**: Visual distribution of pending, confirmed, processing, shipped, delivered, and cancelled orders.
  - **Payment Method & Status Distribution**: COD vs SSLCOMMERZ breakdown and payment ledger states.
  - **Bestselling Streetwear**: Top styles by units sold and revenue.
  - **Low-Stock Warnings**: Real-time alerts for variant SKUs with ≤ 5 units in stock.
  - **Date Range Filters**: Last 7 Days, Last 30 Days, Last 90 Days, and All Time.
  - **CSV Export**: One-click download of full order records via `/api/admin/reports?format=csv`.

---

## 2. Technology Stack

- **Framework**: Next.js 14.2.35 (App Router with Server Components & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & Lucide React
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security & atomic stored procedures)
- **Validation**: Zod
- **Payment Gateway**: SSLCOMMERZ Hosted API v4
- **Logistics**: Pathao Aladdin Courier API & Manual Adapter
- **Transactional Email**: Resend
- **Testing**: Vitest (24/24 unit & integration tests passing)

---

## 3. Getting Started

### Prerequisites
- Node.js (v18.17+ or v20+ or v24+)
- npm (v9+)

### Installation
```bash
# 1. Clone repository
git clone <repository-url>
cd FLASH-WEAR

# 2. Install dependencies
npm install

# 3. Create local environment file
cp .env.example .env.local
```

### Environment Variables
Configure `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# SSLCOMMERZ Payment Gateway
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_SANDBOX=true

# Pathao Courier Logistics
PATHAO_CLIENT_ID=
PATHAO_CLIENT_SECRET=
PATHAO_USERNAME=
PATHAO_PASSWORD=
PATHAO_STORE_ID=
PATHAO_IS_SANDBOX=true

# Transactional Email (Optional - Provider: Resend)
RESEND_API_KEY=
STORE_FROM_EMAIL=orders@flashwear.store
ADMIN_NOTIFICATION_EMAIL=admin@flashwear.store
```

---

## 4. Database Migrations

### Applying Phase 1, Phase 2 & Phase 3 Migrations in Supabase
1. Open your **Supabase Project Dashboard** -> **SQL Editor**.
2. Run Phase 1 migration:
   - File: `supabase/migrations/20261017000000_init_flashwear.sql`
3. Run Phase 2 additive migration:
   - File: `supabase/migrations/20261017000001_phase2_additions.sql`
4. Run Phase 3 additive migration:
   - File: `supabase/migrations/20261017000002_phase3_growth_retention.sql`
   - *Adds `loyalty_settings`, `loyalty_points_ledger`, `referral_settings`, `customer_referrals`, `abandoned_carts`, `stock_price_subscriptions`, `newsletter_subscribers`, `marketing_campaigns`, atomic stored procedures (`redeem_loyalty_points_atomic`, `award_loyalty_points_atomic`, `reverse_loyalty_points_atomic`), and strict RLS policies.*
5. Optional: Run seed data:
   - File: `supabase/seed.sql`

---

## 5. Phase 3: Growth, Marketing & Retention Architecture

### 1. Loyalty & Rewards Program
- **Auditable Points Ledger**: Every credit and debit is immutable in `loyalty_points_ledger`. No customer-editable balance.
- **Atomic Operations**: PostgreSql function `redeem_loyalty_points_atomic` ensures concurrent checkouts cannot double-spend points.
- **Lifecycle Integration**: Points awarded upon verified fulfillment (`delivered`), and clawed back atomically if an order is cancelled or returned.
- **Portals**: Customer portal at `/account/rewards` and Admin control center at `/admin/loyalty`.

### 2. Customer Referral Program
- **Unique Shareable Links**: Each customer receives an auto-generated referral code (e.g. `FLASH-XXXXXX`) and shareable link (`/shop?ref=FLASH-XXXXXX`).
- **Fraud & Self-Referral Prevention**: Server-side validation strictly prevents customers from referring their own accounts, email, or phone.
- **Reward Qualification**: Referrer points are kept in `pending` status until the referred order reaches completed delivery.
- **Portals**: Customer portal at `/account/referrals` and Admin audit log at `/admin/referrals`.

### 3. Abandoned Cart Recovery & Revalidation
- **Automated Capture**: Carts are saved via debounced client sync to `/api/cart/abandoned`.
- **Secure Resume Link**: Recovery link includes a cryptographic token (`/cart?recover=<token>`).
- **Real-Time Revalidation**: Prices and warehouse inventory quantities are verified on recovery; sold-out items are flagged gracefully.
- **Privacy & Consent**: Mandatory one-click unsubscribe route at `/api/cart/unsubscribe` and opt-out suppression.
- **Automated Cron**: `/api/cron/abandoned-carts` gated by `Bearer ${CRON_SECRET}` for bounded batch dispatch (1 hour and 24 hours).

### 4. Back-In-Stock & Price-Drop Subscriptions
- **Granular Variant Subscriptions**: Customers can subscribe for specific sizes and colors when out of stock.
- **Deduplicated Triggers**: Prevents multiple notifications for the same restock or price drop.
- **Unsubscribe Handling**: Secure token-based cancellation link in every notification.

### 5. Consented Marketing Campaigns & Newsletter
- **Consent Tracking**: Explicit opt-in timestamp and IP tracking in `newsletter_subscribers`.
- **Campaign Studio**: Admin interface at `/admin/marketing/campaigns` supporting responsive HTML templates, test previews, and bounded batch dispatch.
- **Unsubscribe Portal**: Public unsubscribe landing page at `/unsubscribe`.

### 6. Advanced Analytics & Google Analytics 4
- **Official GA4 Schema**: Full ecommerce pipeline (`view_item_list`, `select_item`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase`, `refund`).
- **Client-Side Deduplication**: `trackPurchase` prevents double-reporting on page reloads or returns from payment gateway.
- **Shopping Funnel Dashboard**: Admin report at `/admin/reports` visualizing Product Views -> Cart Adds -> Checkout Starts -> Purchases.

### 7. Google Merchant Feed & SEO
- **Merchant Center RSS 2.0 Feed**: `/api/feeds/google-merchant` outputs valid XML with BDT currency, inventory availability, and image links.
- **Structured Data**: Schema.org `Product` and `BreadcrumbList` JSON-LD rendered from authoritative catalog data.
- **Sitemap & Robots**: Private routes (`/admin/`, `/account/`, `/checkout`, `/order-confirmation/`) disallowed in `robots.txt`.

---

## 6. Verification Commands

Run the full automated test suite, TypeScript type checker, linter, and production build:

```bash
# 1. Run Vitest automated test suite (43 passing tests across Phase 1, Phase 2, and Phase 3)
npm run test

# 2. Run TypeScript strict typecheck (0 errors)
npm run typecheck

# 3. Run Next.js ESLint (0 errors)
npm run lint

# 4. Compile optimized production build (58 routes)
npm run build

# 5. Start development dev server
npm run dev
```

---

## 7. Pre-Configured Test Coupons

| Code | Type | Value | Min Order | Description |
| :--- | :--- | :--- | :--- | :--- |
| `FLASH10` | Percentage | 10% (Cap: ৳500) | ৳1,000 | 10% off on all streetwear orders |
| `WELCOME200` | Fixed | ৳200 Flat | ৳2,000 | ৳200 flat discount for new drops |
| `VIP500` | Fixed | ৳500 Flat | ৳4,000 | ৳500 flat discount for VIP club members |

