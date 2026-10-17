# FLASHWEAR — Production-Ready Streetwear E-Commerce (Phase 1)

**FLASHWEAR** is a contemporary, bold, and architectural apparel e-commerce web application engineered for Bangladesh. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, and **Zod**.

---

## 1. Features Implemented in Phase 1

### A. Public Storefront & User Experience
- **Editorial Brand Aesthetic**: High-contrast luxury streetwear dark theme with signature electric-lime accents (`#ccff00`).
- **Interactive Navbar & Bag Drawer**: Live quantity controls, mobile sliding menu, and search modal.
- **Dynamic Homepage**: Announcement bar, marquee delivery alerts, hero headline, category cards, drop capsules, bestsellers, manifesto, customer review samples, and VIP newsletter signup.
- **Product Catalog (`/shop`, `/categories/[slug]`, `/collections/[slug]`)**: Category filters, size/color filters, price sorting, and dynamic search.
- **Product Detail Pages (`/product/[slug]`)**: High-res image gallery with enlarged zoom view, size and color selectors, live inventory tracking per variant, interactive size guide modal (Inches & CM), and related product recommendations.
- **Complete Shopping Bag (`/cart`)**: Persistent cart backed by local storage with server-side price re-validation and inventory limit enforcement.
- **Bangladesh-Focused Guest Checkout (`/checkout`)**:
  - Cash on Delivery (COD) payment flow.
  - Full address, division, and district validation with Bangladesh phone number regex (`01XXXXXXXXX` / `+8801XXXXXXXXX`).
  - Configurable delivery fees (Inside Dhaka ৳80, Outside Dhaka ৳150).
  - Idempotency key protection to prevent accidental duplicate submissions.
  - Server-side stock verification and atomic PostgreSQL transactions.
- **Protected Order Confirmation (`/order-confirmation/[orderNumber]`)**:
  - Scoped receipt tokens prevent public enumeration or unauthorized access to customer personal information.
- **Brand Information & Policies**:
  - `/about`, `/contact`, `/shipping-policy`, `/return-policy`, `/privacy-policy`, `/terms`, and custom 404 page.

### B. Admin Command Center (`/admin`)
- **Overview Dashboard (`/admin`)**: Database-backed metrics: Gross sales (COD), order counts, pending delivery orders, low-stock warnings, recent transactions, and top streetwear styles.
- **Order Management (`/admin/orders`, `/admin/orders/[id]`)**: Full lifecycle status updates (`pending` → `confirmed` → `processing` → `shipped` → `delivered` → `cancelled`), internal notes, courier consignment tracking numbers, and safe order cancellation with automatic stock restoration.
- **Product Management (`/admin/products`, `/admin/products/new`, `/admin/products/[id]`)**: Create, edit, publish, tag as featured or bestseller, manage multi-image galleries, and configure size/color variants with unique SKUs.
- **Category & Collection Control (`/admin/categories`, `/admin/collections`)**: Manage taxonomy and campaign drops.
- **Variant Inventory (`/admin/inventory`)**: Live stock view with low-stock alerts and atomic quantity adjustments.
- **Store Settings (`/admin/settings`)**: Configurable delivery rates for Dhaka and outside Dhaka, low-stock alert thresholds, free shipping threshold, and store contact info.

### C. Architecture & Security
- **Row Level Security (RLS)**: Enforced across all Supabase tables (`profiles`, `user_roles`, `products`, `orders`, etc.).
- **Atomic Order Stored Procedure (`create_guest_order_atomic`)**: Row-level locking (`FOR UPDATE`) guarantees zero race conditions or overselling.
- **Atomic Cancellation Stored Procedure (`cancel_order_and_restore_stock`)**: Restores variant stock back to warehouse upon order cancellation.
- **Fallback Capability**: Operates out-of-the-box in local development with mock stores if Supabase credentials have not yet been provisioned.

---

## 2. Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS & Lucide React
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Input Validation**: Zod
- **Transactional Email**: Resend
- **Testing**: Vitest (Unit/Integration) & Playwright (E2E)

---

## 3. Getting Started

### Prerequisites
- Node.js (v18.17+ or v20+)
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

### Environment Variables Configuration
Edit `.env.local` with your credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Transactional Email (Optional - Provider: Resend)
RESEND_API_KEY=
STORE_FROM_EMAIL=orders@flashwear.store
ADMIN_NOTIFICATION_EMAIL=admin@flashwear.store
```

---

## 4. Supabase Setup & Database Migrations

### Step 1: Run the Database Migration
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open the file `supabase/migrations/20261017000000_init_flashwear.sql`.
3. Copy the entire script, paste it into the SQL Editor, and click **Run**.
   *This creates all tables, indexes, constraints, RLS policies, and stored procedures (`create_guest_order_atomic` and `cancel_order_and_restore_stock`).*

### Step 2: Seed Sample Streetwear Catalog
1. In the Supabase **SQL Editor**, open `supabase/seed.sql`.
2. Copy the entire script, paste it into the SQL Editor, and click **Run**.
   *This populates realistic streetwear products (Hoodies, Graphic Tees, Cargos, Windbreakers, Bags), images, variants, and initial site settings in BDT.*

### Step 3: Setup Supabase Storage Bucket for Product Images
1. In the Supabase Dashboard, navigate to **Storage**.
2. Click **New Bucket**, name it `product-images`, and toggle **Public bucket** ON.
3. Add a storage policy allowing authenticated administrators to upload images:
```sql
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
```

---

## 5. Creating the First Administrator Account

To promote an authenticated user to an Administrator securely:

1. In Supabase Dashboard -> **Authentication** -> **Users**, click **Add User** (or register through the app).
   - Email: `admin@flashwear.store`
   - Password: `<your-secure-password>`
2. Copy the newly created user's **User ID (UUID)**.
3. Open Supabase **SQL Editor** and run:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<PASTE-USER-UUID-HERE>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```
4. You can now log into `/admin/login` using those credentials!
*(In local development mode without Supabase connected, you can log into `/admin/login` using the default passphrase: `flashwear2026`)*.

---

## 6. Running Locally & Testing

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Unit & Integration Tests
```bash
npm run test
```
*Runs 10 automated Vitest unit tests covering BDT pricing, delivery fees, phone validation, atomic stock decrements, overselling prevention, and cancellation restoration.*

### Production Build
```bash
npm run build
npm run start
```

---

## 7. Project Structure

```
├── e2e/                           # Playwright end-to-end tests
├── src/
│   ├── app/                       # Next.js App Router routes
│   │   ├── admin/                 # Protected Admin Command Center
│   │   ├── api/                   # Server-side Route Handlers (Checkout, Orders, Newsletter)
│   │   ├── categories/[slug]/     # Dynamic Category pages
│   │   ├── collections/[slug]/    # Dynamic Capsule Collection pages
│   │   ├── product/[slug]/        # Product Detail pages
│   │   ├── cart/                  # Shopping bag page
│   │   ├── checkout/              # Guest COD checkout page
│   │   ├── order-confirmation/    # Token-protected order confirmation
│   │   ├── layout.tsx             # Root layout with CartProvider & Navbar
│   │   ├── page.tsx               # Homepage assembling 9 fashion sections
│   │   └── globals.css            # Luxury streetwear dark theme
│   ├── components/                # Reusable UI components
│   │   ├── admin/                 # Order & Product management components
│   │   ├── home/                  # Hero, categories, story, reviews, newsletter
│   │   ├── ui/                    # Buttons, Badges, Inputs, Modals
│   │   ├── navbar.tsx             # Responsive header with search & bag
│   │   ├── cart-drawer.tsx        # Slide-over cart panel
│   │   └── product-card.tsx       # Streetwear card with hover zoom & tags
│   └── lib/
│       ├── data/                  # In-memory streetwear catalog fallback
│       ├── email/                 # Resend transactional email integration
│       ├── services/              # Business logic (Catalog, Orders, Transactions)
│       ├── supabase/              # Supabase browser, server & admin clients
│       ├── types/                 # TypeScript interfaces
│       └── utils/                 # Formatting, currency, and order IDs
└── supabase/
    ├── migrations/                # SQL migrations with RLS & functions
    └── seed.sql                   # Realistic initial streetwear seed catalog
```

---

## 8. Definition of Done Verification

| Requirement | Status | Notes |
|---|---|---|
| Responsive Storefront | Passed | Works on mobile, tablet, and desktop |
| Supabase Product Catalog | Passed | Dynamic queries with fallback support |
| Variants & Inventory | Passed | Sizes, colors, SKUs, and stock tracking |
| Shopping Cart | Passed | Local storage sync, line totals, delivery estimates |
| Cash on Delivery Checkout | Passed | BD phone regex, divisions, atomic decrement |
| Overselling Prevention | Passed | Atomic PostgreSQL functions & in-memory locking |
| Admin Command Center | Passed | Orders, products, categories, collections, inventory, settings |
| Private Order Protection | Passed | Scoped receipt tokens prevent unauthorized snooping |
| Tests Passing | Passed | 10/10 Vitest tests passed with code 0 |
| Strict TypeScript | Passed | `tsc --noEmit` passed with 0 errors |
