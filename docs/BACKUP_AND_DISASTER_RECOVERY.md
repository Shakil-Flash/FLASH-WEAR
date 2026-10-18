# FLASHWEAR — Backup & Disaster Recovery Runbook

Official Reference: [Supabase Backup and Restore Guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

## 1. Objectives & Targets
- **Recovery Point Objective (RPO)**:
  - Supabase Pro Plan (Automated Daily Backups): `< 24 hours`
  - With Supabase Point-in-Time Recovery (PITR enabled): `< 2 minutes`
  - With pg_dump automated backup script: `< 6 hours`
- **Recovery Time Objective (RTO)**:
  - Database provision and restore into isolated project: `< 45 minutes`
  - DNS / Vercel environment redirection: `< 15 minutes`
  - Total Target RTO: `< 1 hour`

---

## 2. Backup Strategy by Platform Tier

### Supabase Platform Backups
- **Free Tier**: No automated daily backups. Manual backup via `pg_dump` required before any release.
- **Pro Tier ($25/mo)**: Automated daily physical backups retained for 7 days.
- **Pro + PITR Add-on**: Continuous write-ahead log (WAL) archiving allowing point-in-time restoration to any second in the past 7 to 28 days.

### Manual / Scheduled Logical Backups (Independent Offsite Backup)
To ensure business continuity independent of any single cloud provider, run an automated cron job or GitHub Action that exports an encrypted logical database dump to an offsite S3/GCS bucket:

```bash
# Export schema and data using pg_dump
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --dbname="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres" \
  --file="flashwear_backup_$(date +%Y%m%d_%H%M%S).dump"

# Encrypt backup archive with GPG
gpg --symmetric --cipher-algo AES256 "flashwear_backup_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 3. Storage Asset Recovery (`product-images`)
- Product catalog assets in the Supabase Storage bucket `product-images` must be mirrored or synced to a secondary backup location (such as Cloudflare R2 or AWS S3):
```bash
# Sync storage bucket using AWS S3 CLI with Supabase S3-compatible credentials
aws s3 sync \
  s3://product-images \
  s3://flashwear-backup-vault/product-images/ \
  --endpoint-url "https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/s3"
```

---

## 4. Disaster Recovery Drill Procedure (Tested on Isolated Project)

> [!CAUTION]
> NEVER test restoration against the live production database! Always restore into a dedicated recovery drill project (e.g., `flashwear-dr-drill`).

### Step 1: Provision Recovery Target Database
Create a clean Supabase project: `flashwear-dr-drill`.

### Step 2: Restore Database Snapshot
```bash
# Restore schema and records into target
pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --dbname="postgresql://postgres:${RECOVERY_DB_PASSWORD}@db.${RECOVERY_PROJECT_ID}.supabase.co:5432/postgres" \
  "flashwear_backup_latest.dump"
```

### Step 3: Verify Integrity & Policies
Execute validation queries in target:
```sql
-- 1. Check record counts
SELECT 'products' AS tbl, count(*) FROM public.products
UNION ALL
SELECT 'product_variants', count(*) FROM public.product_variants
UNION ALL
SELECT 'orders', count(*) FROM public.orders
UNION ALL
SELECT 'site_settings', count(*) FROM public.site_settings;

-- 2. Check Row Level Security
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### Step 4: Application Connection Smoke Test
Update `.env.test.local` to point to the restored project credentials and run:
```bash
npm run test
```
Verify that all 51 test suites pass against the restored data structures.

---

## 5. Compromised Credentials Response
If the `SUPABASE_SERVICE_ROLE_KEY` or `SSLCOMMERZ_STORE_PASSWORD` is exposed:
1. Immediately navigate to the Supabase Dashboard -> **Project Settings** -> **API**.
2. Click **Generate New Service Role Key**. This immediately invalidates the compromised key.
3. Update the `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables.
4. Trigger an immediate redeploy of the Next.js application.
5. In SSLCOMMERZ Merchant Portal, regenerate the Store Password and update Vercel settings.
6. Inspect `public.security_audit_logs` in the database to detect unauthorized operations during the exposure window.
