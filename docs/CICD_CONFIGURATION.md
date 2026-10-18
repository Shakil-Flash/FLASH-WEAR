# FLASHWEAR — CI/CD Pipeline & GitHub Actions Guide

## 1. Overview
FLASHWEAR utilizes GitHub Actions for continuous integration (CI) quality gates and continuous deployment (CD) with strict environment separation.

---

## 2. Workflows Overview

### A. CI Workflow (`.github/workflows/ci.yml`)
- **Triggers**:
  - Every `push` to `main` and `staging` branches.
  - Every `pull_request` targeting `main` or `staging`.
- **Quality Gates Executed**:
  1. `npm ci` — strict lockfile dependency installation.
  2. `npm run lint` — ESLint static analysis and React best practices.
  3. `npm run typecheck` — TypeScript strict-mode type safety verification (`tsc --noEmit`).
  4. `npm run test` — Vitest unit & regression suite (51 tests across all phases).
  5. SQL Migration Syntax & Non-empty check on `supabase/migrations/*.sql`.
  6. `npm run build` — Next.js production build and page static generation.

### B. CD Release Pipeline (`.github/workflows/deploy.yml`)
- **Triggers**:
  - Merges to `staging` branch -> Deploys to Staging environment.
  - Merges to `main` branch -> Deploys to Production environment (with manual approval protection).
  - Manual execution via `workflow_dispatch`.
- **Deployment Steps**:
  1. Setup Supabase CLI.
  2. Apply pending versioned SQL migrations using `supabase db push`.
  3. Deploy web application to Vercel via official `amondnet/vercel-action`.

---

## 3. GitHub Secrets Configuration
Configure the following secrets in GitHub Repository Settings -> **Secrets and variables** -> **Actions**:

| Secret Name | Description | Environment |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Personal Access Token from Vercel | Global / Repo |
| `VERCEL_ORG_ID` | Vercel Organization / Team ID | Global / Repo |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Global / Repo |
| `SUPABASE_PROJECT_ID` | Production Supabase Project Reference | Production |
| `SUPABASE_DB_PASSWORD` | Production Supabase PostgreSQL Password | Production |

---

## 4. Environment Protection Rules
In GitHub Settings -> **Environments**:
1. Create environment: `production`.
2. Enable **Required reviewers** (select senior engineers / architects).
3. Require deployment approval before migrations or code changes can hit the production database.
