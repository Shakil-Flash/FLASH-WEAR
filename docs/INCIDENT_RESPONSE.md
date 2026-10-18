# FLASHWEAR — Production Incident Response Checklist

## 1. Incident Severity Definitions
- **SEV-1 (Critical Outage)**: Checkout unavailable, payment callback failures, database inaccessible, customer data security breach.
- **SEV-2 (Major Impairment)**: Courier booking failing, coupon system errors, marketing campaign failures, elevated 5xx rate.
- **SEV-3 (Minor Degraded State)**: Single product image loading failure, non-critical background task delay.

---

## 2. Phase 1: Immediate Triage (< 15 Minutes)
1. **Acknowledge Alert**: Incident commander claims the incident in the alerting channel (`#ops-incidents`).
2. **Verify User Impact**:
   - Check `/api/health?type=readiness`.
   - Inspect Vercel real-time analytics for HTTP 500 error spikes.
   - Test storefront checkout flow with test order.
3. **Establish Incident Communication**:
   - Update internal status in `#ops-incidents`.
   - If customer-facing, post maintenance message or announcement banner via `/admin/settings`.

---

## 3. Phase 2: Containment & Mitigation
- **Database Overload / Connection Spike**:
  - Check Supabase Dashboard -> **Database** -> **Connection Pooling**.
  - Terminate long-running lock queries:
    ```sql
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '30 seconds';
    ```
- **Payment Verification Failure Spike**:
  - Check SSLCOMMERZ gateway status page.
  - Temporarily restrict storefront to Cash on Delivery (COD) by toggling store announcement in `/admin/settings`.
- **Bad Code Release**:
  - Immediately trigger Instant Rollback in Vercel to previous deployment.

---

## 4. Phase 3: Resolution & Verification
1. Verify `/api/health` returns status `200 healthy`.
2. Execute end-to-end checkout smoke test.
3. Confirm unhandled error rate drops below `0.1%`.

---

## 5. Phase 4: Post-Mortem & Blameless Review
Within 48 hours of any SEV-1 or SEV-2 incident:
1. Document root cause and timeline.
2. Record total impact (downtime duration, affected orders, customer inquiries).
3. Create corrective action items with assigned owners (e.g., adding automated regression tests, tuning connection pool, improving timeout limits).
