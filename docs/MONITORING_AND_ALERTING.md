# FLASHWEAR — Monitoring, Structured Logging & Alerting Guide

## 1. Observability Architecture
FLASHWEAR combines structured machine-readable logging (`src/lib/logger.ts`), deep health telemetry (`/api/health`), Vercel Runtime Logs, and optional Sentry error tracking.

---

## 2. Structured Logging Guidelines
All server logs are output in structured JSON format in production with automatic redaction of sensitive credentials and customer PII:

```json
{
  "level": "error",
  "message": "Payment IPN verification failed: hash mismatch",
  "timestamp": "2026-10-18T07:15:22.184Z",
  "environment": "production",
  "operation": "sslcommerz.ipn",
  "requestId": "req_88192a8b",
  "data": {
    "orderNumber": "FLW-88192",
    "val_id": "VAL_10023",
    "tran_id": "FLW-88192-17188",
    "store_password": "[REDACTED]"
  }
}
```

### Logging Principles:
- **Never Log**: Raw passwords, CVVs, full card numbers, API secret keys, bearer tokens, or unneeded customer addresses.
- **Always Include**: `operation`, `requestId`, `orderNumber` (if applicable), and sanitized error reason.

---

## 3. Severity Matrix & Alert Escalation

| Severity | Event Type | Alert Channel | Target Response Time | Example |
| :--- | :--- | :--- | :--- | :--- |
| **P0 - Critical** | Checkout / Payment Outage | PagerDuty / SMS / Discord Alert Webhook | `< 15 minutes` | SSLCOMMERZ gateway returning 5xx; database connection exhausted; health check returning 503. |
| **P1 - High** | Payment Verification Failure | Slack #ops-alerts / Email | `< 1 hour` | IPN hash mismatch on paid transaction; duplicate payment notification conflict. |
| **P2 - Medium** | Background Job / Courier Failures | Slack #engineering / Email | `< 4 hours` | Pathao API authentication failure; abandoned cart cron batch partial failure. |
| **P3 - Low** | Rate Limit Triggers / 404s | Daily Digest / Weekly Review | Next Business Day | Customer triggered 429 rate limit on newsletter; missing static asset. |

---

## 4. Health Check Monitoring Configuration
Configure an uptime monitoring probe (e.g., Better Uptime, UptimeRobot, Pingdom) targeting:
- **Endpoint**: `https://flashwear.store/api/health?type=readiness`
- **Expected Status**: `HTTP 200`
- **Frequency**: Every 60 seconds
- **Timeout**: 5000ms
- **Failure Threshold**: 2 consecutive failures triggers a P0 alert to the on-call engineer.

---

## 5. Sentry Integration Setup
To activate full exception tracking:
1. Create a Sentry project for Next.js.
2. Add `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to Vercel Environment Variables.
3. Errors captured by `src/app/error.tsx` or unhandled promise rejections will automatically be forwarded to the Sentry dashboard with sanitized request metadata.
