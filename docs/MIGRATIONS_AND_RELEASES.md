# FLASHWEAR — Database Migration & Release Safety Procedure

## 1. Migration Philosophy & Rules
1. **Never perform undocumented manual schema changes in production.** Every change must exist as a versioned `.sql` file in `supabase/migrations/`.
2. **Migrations must be backward-compatible.** Always follow the **Expand and Contract** pattern so existing application pods continue operating without downtime while the migration runs.
3. **Never drop columns or tables destructively in an initial migration.** Mark deprecated columns as nullable, remove application references in the subsequent code release, and only drop in a later cleanup release.
4. **Always test against an isolated staging database** before running against production.

---

## 2. Versioned Migration Catalog

| Migration File | Description | Rollback Compatibility |
| :--- | :--- | :--- |
| `20261017000000_init_flashwear.sql` | Core catalog: products, variants, categories, collections, orders, items, cart | Additive |
| `20261017000001_phase2_additions.sql` | Addresses, payment transactions, courier consignments, return requests | Additive |
| `20261017000002_phase3_growth_retention.sql` | Coupons, loyalty points ledger, referral codes, marketing subscribers, abandoned carts | Additive |
| `20261017000003_phase4_production_hardening.sql` | High-concurrency composite indexes, job_run_logs, security_audit_logs, hardened RLS | Additive |

---

## 3. Pre-Migration Release Checklist
Before applying any migration to production:
- [ ] Database backup snapshot taken and verified in Supabase Dashboard.
- [ ] Migration validated on staging environment with zero syntax or lock errors.
- [ ] Migration execution does not hold exclusive table locks (`ACCESS EXCLUSIVE`) during peak checkout hours.
- [ ] All new foreign keys include corresponding indexes.
- [ ] Row Level Security (RLS) is enabled on all newly created tables.
- [ ] Service role access policies are defined and tested.

---

## 4. Execution Commands (Supabase CLI)

### Validating Migrations Locally
```bash
# Check migration syntax and diff against local Supabase instance
supabase db diff
```

### Applying to Staging Environment
```bash
supabase link --project-ref <staging-project-ref>
supabase db push
```

### Applying to Production Environment
```bash
supabase link --project-ref <production-project-ref>
supabase db push
```

---

## 5. Post-Migration Verification Queries
Run these queries in the Supabase SQL Editor to verify schema state:

```sql
-- 1. Check all expected indexes exist and are valid
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 2. Verify Row Level Security is active across all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 3. Check for any table locks
SELECT pid, mode, granted, query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE a.query NOT LIKE '%pg_stat_activity%';
```

---

## 6. Forward-Fix & Rollback Strategy
If a migration fails or causes unexpected performance degradation:
1. **Never write a rollback that drops columns containing customer or financial data.**
2. If an index causes slow writes or lock contention, drop only the index concurrently:
   ```sql
   DROP INDEX CONCURRENTLY IF EXISTS public.idx_name;
   ```
3. If an application bug is detected, revert the application deployment in Vercel to the previous deployment SHA while leaving backward-compatible database additions intact.
4. For data corruption incidents, follow `docs/BACKUP_AND_DISASTER_RECOVERY.md`.
