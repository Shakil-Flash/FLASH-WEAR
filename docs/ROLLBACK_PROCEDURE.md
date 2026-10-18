# FLASHWEAR — Production Rollback Procedure

## 1. Application Deployment Rollback (Instant)

Because FLASHWEAR runs on Vercel, application rollbacks can be performed instantaneously without rebuilding:

1. Open the [Vercel Dashboard](https://vercel.com/) and navigate to the `flashwear` project.
2. Go to the **Deployments** tab.
3. Locate the previous stable production deployment.
4. Click the three dots (`...`) next to that deployment and select **Instant Rollback**.
5. Vercel redirects edge traffic to the previous immutable deployment artifact within `< 15 seconds`.
6. Verify live traffic is restored by checking `/api/health`.

---

## 2. Database Schema Rollback (Safe Non-Destructive Approach)

> [!IMPORTANT]
> FLASHWEAR migrations follow the Expand & Contract architecture. Schema changes are strictly backward-compatible. Rolling back an application deployment DOES NOT require reversing database columns or tables, and dropping columns containing customer data is STRICTLY PROHIBITED.

### When to Roll Back a Database Change:
- **Case A: Newly created index causes write lock contention or slow queries**
  - Fix: Drop the problematic index concurrently without blocking writes:
    ```sql
    DROP INDEX CONCURRENTLY IF EXISTS public.idx_problematic_name;
    ```
- **Case B: Newly added RLS policy unintentionally restricts legitimate customer reads**
  - Fix: Adjust or temporarily revert the specific policy without affecting table structure:
    ```sql
    DROP POLICY IF EXISTS "Problematic Policy" ON public.target_table;
    ```
- **Case C: Bug in a database trigger or function**
  - Fix: Replace the function definition with the previous implementation (`CREATE OR REPLACE FUNCTION ...`).

---

## 3. Post-Rollback Validation
After executing a rollback:
1. Verify `/api/health?type=readiness` returns status `200`.
2. Inspect `/admin/operations` to verify all dependencies show active status.
3. Test placing a Cash on Delivery order and verifying stock decrement.
4. Notify the engineering team in `#ops-alerts` that rollback is complete and root-cause analysis has commenced.
