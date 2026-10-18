# FLASHWEAR — Payment & Courier Troubleshooting Guide

## 1. SSLCOMMERZ Online Payment Troubleshooting

### Flow Architecture
1. **Initiation**: Customer submits checkout -> `/api/checkout` reserves stock and calls `/api/payments/sslcommerz/init`.
2. **Session Creation**: Server communicates with SSLCOMMERZ API endpoint (`gwprocess/v4/api.php`) passing `store_id`, `store_passwd`, amount, currency (`BDT`), and order details.
3. **Redirect**: Customer is redirected to `GatewayPageURL`.
4. **Browser Return**:
   - Success: `/api/payments/sslcommerz/success`
   - Failure: `/api/payments/sslcommerz/fail`
   - Cancel: `/api/payments/sslcommerz/cancel`
5. **Server Verification (IPN)**: SSLCOMMERZ sends backend POST to `/api/payments/sslcommerz/ipn`. FLASHWEAR performs server-to-server validation against SSLCOMMERZ `validator/api/validationserverAPI.php` checking:
   - `val_id`
   - `status === "VALID"` or `"VALIDATED"`
   - `currency_amount === order.total_amount`
   - `currency_type === "BDT"`

### Common Errors & Remedies

#### A. "Invalid Store ID or Password"
- **Symptom**: Customer sees immediate error upon clicking "Pay with SSLCOMMERZ".
- **Diagnosis**: Verify `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD`.
- **Note**: Ensure `SSLCOMMERZ_IS_SANDBOX` matches credentials. A sandbox store ID will fail on live endpoints, and vice versa.

#### B. Browser Redirect Marked as Paid Before IPN
- **Security Check**: FLASHWEAR **never** marks an order paid based purely on query parameters from the browser. The order payment status is only updated to `"paid"` after server-side validation against `validationserverAPI.php`.

#### C. Duplicate IPN Notifications
- **Symptom**: SSLCOMMERZ retries IPN notifications multiple times.
- **Handling**: Payment state transition in FLASHWEAR is idempotent. If an order is already marked `"paid"`, subsequent IPNs log the duplicate event, verify the matching transaction ID, and return HTTP 200 without modifying inventory again.

---

## 2. Pathao Courier Logistics Troubleshooting

### Flow Architecture
1. Admin opens order detail at `/admin/orders/[id]`.
2. Admin reviews consignment details (recipient, address, COD amount) and clicks **"Book Pathao Shipment"**.
3. Endpoint `/api/admin/orders/[id]/ship` requests short-lived access token from Pathao OAuth `/aladdin/api/v1/issue-token`.
4. Endpoint creates consignment via `/aladdin/api/v1/orders`.
5. FLASHWEAR updates order record with `consignment_id`, `tracking_url`, and changes shipping status to `"shipped"`.

### Common Errors & Remedies

#### A. "Authentication failed: invalid client credentials"
- **Diagnosis**: Check `PATHAO_CLIENT_ID`, `PATHAO_CLIENT_SECRET`, `PATHAO_USERNAME`, and `PATHAO_PASSWORD` in Vercel.
- **Verification**: Run curl to Pathao auth endpoint using credentials.

#### B. "Invalid Pickup Hub / Store ID"
- **Diagnosis**: `PATHAO_STORE_ID` must match a verified pickup hub registered in your Pathao merchant account. Check Merchant Portal -> Settings -> Pickup Locations.

#### C. Manual Courier Fallback
- If the Pathao API is temporarily experiencing downtime or maintenance:
  1. Open `/admin/orders/[id]`.
  2. Select "Manual Courier / In-House Courier" from the courier dropdown.
  3. Enter the physical consignment number from the parcel slip.
  4. Save shipment to update tracking for customer account visibility.
