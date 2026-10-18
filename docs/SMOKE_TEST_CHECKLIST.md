# FLASHWEAR — Production Smoke Test Checklist

Execute this checklist immediately following any production release or disaster recovery drill.

## 1. Storefront Browsing & Product Discovery
- [ ] **Homepage**: Header navigation, hero banner, featured collection grid, and announcement bar render without errors.
- [ ] **Catalog (/shop)**: Category filters, collection filters, price range filter, and sorting (price low-to-high, high-to-low, newest) update product grid.
- [ ] **Product Detail (/product/[slug])**: Size selector, color selector, inventory stock indicator ("In Stock" / "Low Stock" / "Out of Stock"), image gallery, and sticky "Add to Bag" bar function.
- [ ] **Search (/search)**: Live search input filters products by name, description, and category.
- [ ] **SEO & Metadata**: Page title, meta description, OpenGraph tags, and canonical URLs present in `<head>`.

---

## 2. Cart & Promotions
- [ ] **Cart Drawer & Page (/cart)**: Adding variant updates cart badge count. Quantity increments/decrements work. Item removal works. Subtotal recalculates accurately.
- [ ] **Coupon Application**: Applying valid coupon (e.g., `WELCOME10`) applies discount. Applying expired or invalid coupon displays clear error message.
- [ ] **Referral Code**: Applying friend's referral code calculates discount and updates summary.

---

## 3. Checkout & Payment Workflows
- [ ] **Cash on Delivery (COD)**:
  - Form validates customer name, 11-digit Bangladesh phone number, district, division, and delivery address.
  - Delivery fee updates accurately based on Dhaka (৳80) vs Outside Dhaka (৳130).
  - Submitting order decrements variant inventory atomically.
  - Redirects to `/order-confirmation/[orderNumber]` with order summary and receipt.
- [ ] **SSLCOMMERZ Online Payment**:
  - Selecting "SSLCOMMERZ" initiates payment session.
  - Redirects to SSLCOMMERZ gateway page.
  - Sandbox test payment redirects back to confirmation with status `paid`.
  - In production mode, mock gateway route `/api/payments/sslcommerz/mock-gateway` is blocked with HTTP 403.

---

## 4. Customer Accounts & Security
- [ ] **Account Login / Register**: Authentication functions with session cookie issuance.
- [ ] **Profile (/account/profile)**: Customer can update full name and phone number. Record is scoped to authenticated session.
- [ ] **Addresses (/account/addresses)**: Customer can add, set default, and delete delivery addresses.
- [ ] **Order History (/account/orders)**: Lists customer's past orders with shipment status and tracking buttons. Accessing another customer's order number returns 404 or unauthorized.
- [ ] **Wishlist (/account/wishlist)**: Toggling heart icon on product card saves to wishlist.

---

## 5. Administrative Operations & Control
- [ ] **Admin Authentication**: Visiting `/admin` without session cookie redirects to `/admin/login`. Logging in sets HttpOnly `flashwear_admin_session`.
- [ ] **Order Management (/admin/orders)**: Admin can filter by status, view order detail, update order status, and book Pathao courier consignment.
- [ ] **Operations & Health (/admin/operations)**: Real-time dependency status displays green for active services; manual cron trigger executes without errors.
- [ ] **Reports & CSV Export (/admin/reports)**: Revenue metrics render; clicking "Export Orders CSV" downloads valid UTF-8 CSV.
- [ ] **System Health (/api/health)**: Returns HTTP 200 with latency and uptime metrics.
