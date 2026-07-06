# Deployment Readiness Implementation Plan

> **Status:** NOT READY — Overall ~53% ready
> **Generated:** 2026-07-06
> **Scope:** Backend (NestJS), Frontend (Next.js), ML Service (FastAPI), Infrastructure, Documentation

This plan consolidates findings from a full deployment-readiness audit and lays out a
step-by-step path to production. Work top-to-bottom: **Phase 1 items are hard blockers.**

---

## Readiness Scorecard

| Component      | Score | Status                        |
| -------------- | ----- | ----------------------------- |
| Backend        | 85%   | ✅ Ready with minor fixes      |
| Frontend       | 75%   | ⚠️ Needs vulnerability fix     |
| ML Service     | 40%   | ❌ Major work required         |
| Infrastructure | 20%   | ❌ Missing core components      |
| Documentation  | 45%   | ❌ Missing deployment docs      |
| **Overall**    | 53%   | ❌ **Not ready**               |

---

## Phase 1 — Critical Blockers (Must fix before ANY deploy)

Target: **Week 1**. Nothing ships until every box here is checked.

### 1.1 Fix security vulnerabilities — ✅ DONE (0 vulnerabilities both apps)

- [x] Backend: `npm audit fix` cleared `form-data`, `js-yaml`, `@babel/core`.
      Remaining multer/NestJS HIGH (8) fixed via `overrides: { "multer": "2.2.0" }`
      in `package.json` — avoids the `--force` downgrade to NestJS 7. **Now 0 vulns.**
      Verified `npm run build` passes with `multer@2.2.0 overridden`.
- [x] Frontend: `postcss` XSS + `js-yaml` DoS fixed via
      `overrides: { "postcss": "^8.5.10", "js-yaml": "^4.3.0" }` (installed 8.5.16 / 4.3.0).
      Avoided the `--force` downgrade to Next.js 9. **Now 0 vulns.** `npm run build` passes.
      Note: install requires `--legacy-peer-deps` (pre-existing `@ai-sdk/react`↔react peer conflict).
- [x] Also fixed a latent `next.config.ts` bug: `optimizePackageImports` moved under
      `experimental` (was silently ignored, so tree-shaking wasn't active).
- [ ] Add `npm audit` as a CI step so this cannot regress (see 2.3)

> The two `--force` fixes npm suggested were catastrophic downgrades (NestJS 11→7,
> Next.js 15→9). Used npm `overrides` to pull only the patched transitive packages
> instead, keeping all majors intact. Both apps build successfully.

### 1.2 Resolve pending database migrations (schema drift)

Schema contains models with **no migration files**: `TreatmentPlan`, `Intervention`,
`ClinicalNote`, `SharedDocument`, `Achievement`, `UserAchievement`, `UserGamification`,
`ChildGamification`, `BehavioralTrend`, `GazeSessionData`, `DataExportRequest`,
`WebhookDelivery`.

- [x] Confirmed drift via `prisma migrate diff` — 12 models missing from migrations
- [x] Generated `20260707001856_add_phase2_through_phase5_models/migration.sql`
      (352 lines: 12 tables, 2 enums, 15 FK constraints) via scriptable `migrate diff`
      (`migrate dev` refuses non-interactive shells)
- [x] Verified SQL covers all 12 models: TreatmentPlan, Intervention, ClinicalNote,
      SharedDocument, Achievement, UserAchievement, UserGamification, ChildGamification,
      BehavioralTrend, GazeSessionData, DataExportRequest, WebhookDelivery
- [x] Applied via `prisma migrate reset` (dev DB was empty — 0 rows, safe).
      Final state: **"Database schema is up to date!"**, drift diff empty,
      **33 tables total, all 12 new tables physically verified present.**

> The dev DB had lost its `_prisma_migrations` history and was missing the 12 tables.
> Since it held 0 rows, a full reset was safe and produced a correct, replayable
> migration history — exactly what production `migrate deploy` needs.

### 1.3 Commit migrations to version control — ✅ gitignore fixed

- [x] Remove `prisma/migrations/` from `backend/.gitignore`
- [x] New migration `20260707001856_add_phase2_through_phase5_models` created & tracked
- [ ] `git add`/commit the 7 migration files (not committed yet — repo not initialized here)
- [x] `migration_lock.toml` present (provider = postgresql)

### 1.4 Containerize all services — ✅ DONE

- [x] `backend/Dockerfile` — multi-stage, Node 22, non-root, `HEALTHCHECK` on `/health`, `prisma generate`
- [x] `frontend/Dockerfile` — `output: 'standalone'` enabled, multi-stage, non-root
- [x] `ml-service/Dockerfile` — `python:3.11-slim` + OpenCV deps, trains model at build
- [x] `.dockerignore` added to all three services
- [x] `docker-compose.prod.yml` wiring all 3 app services + Postgres + Redis + Ollama
- [ ] Build & smoke-test each image locally (needs shell/Docker)

### 1.5 Pin ML service dependencies — ✅ DONE

- [x] `requirements.txt` rewritten with exact `==` versions
- [ ] Generate lock: `pip freeze > requirements.lock` (needs shell; optional)
- [x] Constrain Python in `pyproject.toml`: `requires-python = ">=3.10,<3.14"`

### 1.6 Resolve ML model artifact strategy — ✅ DONE (Option C)

- [x] Strategy chosen: **Option C** — `train_model.py` runs during Docker build
- [x] Documented in `ml-service/README.md`
- [ ] (Optional) initialize `app/models/registry.json` at runtime via promotion API

### 1.7 Environment-based backend URL (frontend) — ✅ DONE

- [x] `frontend/next.config.ts` rewrites now use `BACKEND_URL` env var
- [x] Applied to `/api/v1/*`, `/ml/*`, `/ai/*`
- [x] `BACKEND_URL` documented in `frontend/.env.example`

### 1.8 Fix `.env.example` drift — ✅ DONE

- [x] Root `.env.example`: MongoDB URI replaced with PostgreSQL `DATABASE_URL`
- [x] Added `JWT_SECRET`, `ALLOWED_ORIGINS`, `REDIS_URL`, `BACKEND_URL`, Postgres creds

---

## Phase 2 — Deployment Infrastructure

Target: **Week 2**. Makes deploys repeatable and safe.

### 2.1 Secrets management

- [ ] Move all secrets out of `.env` files into a manager (AWS Secrets Manager / Vault)
- [ ] Use GitHub Actions secrets for CI/CD
- [ ] Add a pre-commit secret scanner (`git-secrets` or `gitleaks`)
- [ ] Define a secret rotation policy for `JWT_SECRET`, API keys, DB creds

### 2.2 Deployment documentation

- [ ] Create `docs/DEPLOYMENT.md`:
  - Production environment requirements (CPU/mem per service)
  - Env var checklist per service
  - Build → migrate → start sequence
  - SSL/TLS + domain configuration
  - Rollback procedure (app + `prisma migrate resolve --rolled-back`)

### 2.3 CI/CD deployment pipeline

- [ ] Extend `.github/workflows/` beyond lint/build/test:
  - `npm audit` gate (from 1.1)
  - Build & push images to a registry (GHCR/ECR)
  - Deploy to staging → manual approval → production
  - GitHub Environments with protection rules
  - Rollback workflow for failed deploys

### 2.4 Harden production config

- [ ] Gate Swagger behind non-prod:
  ```ts
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }
  ```
- [ ] Protect `/metrics` endpoint (auth or network policy) — currently unauthenticated
- [ ] Review CSP: replace `'unsafe-inline'` with nonces/hashes where feasible

### 2.5 Repository hygiene

- [ ] Add `LICENSE` file (MIT recommended, or proprietary)
- [ ] Add `CONTRIBUTING.md` (branch naming, commit format, PR flow, test requirements)
- [ ] Add `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/`

---

## Phase 3 — Production Hardening

Target: **Week 3**. Observability, resilience, quality.

### 3.1 Monitoring & observability

- [ ] Integrate APM (Sentry or DataDog) in backend + frontend
- [ ] Ship logs to a centralized service (ELK / DataDog / CloudWatch)
- [ ] Grafana dashboards for the existing Prometheus `/metrics`
- [ ] Alerts on error rate, latency, resource usage

### 3.2 Backup & recovery

- [ ] Automated PostgreSQL backups (daily snapshot, 30-day retention, WAL archiving)
- [ ] Document + test restore procedure (define RTO/RPO)
- [ ] S3 lifecycle policies for report backups

### 3.3 ML service tests

- [ ] Create `ml-service/tests/` with `pytest`, `pytest-asyncio`, `httpx`
- [ ] Cover: model loading/prediction, input validation edges, session TTL, drift detection, error paths
- [ ] Add ML test step to CI

### 3.4 Backend test coverage

- [ ] Run `npm run test:cov`; confirm ≥70% on auth + screening flows
- [ ] Wire coverage reporting into CI

### 3.5 Frontend SEO & polish

- [ ] Add Open Graph + Twitter Card metadata in `layout.tsx`
- [ ] Add `robots.ts` and `sitemap.ts`
- [ ] Add request timeout / `AbortController` to `api/client.ts`
- [ ] Consider `global-error.tsx` for root-layout errors

### 3.6 Changelog

- [ ] Create `CHANGELOG.md` (Keep a Changelog format), seed from git history

---

## Phase 4 — Advanced Infrastructure (Optional / scale-dependent)

- [ ] Infrastructure as Code (Terraform modules or Kubernetes manifests)
- [ ] Horizontal Pod Autoscaler + load balancer config
- [ ] Blue-green or canary deployment strategy
- [ ] ML service scaling (queue-based processing, resource limits)
- [ ] CDN for static assets
- [ ] Connection pooling for PostgreSQL (PgBouncer)

---

## What's Already Ready ✅

Do not re-do these — they passed the audit:

- Backend security: JWT + refresh rotation, RBAC, rate limiting, CORS whitelist, Helmet, `ValidationPipe`
- Backend error handling: Winston logging, global exception filter, correlation IDs, graceful shutdown
- Health checks: `/health` + `/ready` (backend), `/health/*` (ML service), DB connectivity check
- Feature flags: 10 flags, Redis-cached, env override support
- Database: Prisma schema (876 lines), 6 migrations, seed script
- Frontend performance: dynamic imports, image optimization (AVIF/WebP), React Query caching
- Frontend accessibility: skip links, ARIA attributes, reduced-motion, a11y settings panel
- Frontend error boundaries: root + route-level `error.tsx`, `not-found.tsx`
- ML API: FastAPI with Pydantic validation, structlog, Prometheus, model registry, drift detection, graceful fallbacks

---

## Quick-Start Commands

```bash
# Phase 1.1 — Security
cd backend && npm audit fix && cd ..
cd frontend && npm audit fix && cd ..

# Phase 1.2/1.3 — Migrations
cd backend
npx prisma migrate status
npx prisma migrate dev --name add_phase2_through_phase5_models
# then remove prisma/migrations/ from .gitignore and commit

# Phase 1.5 — Pin ML deps
cd ml-service
pip freeze > requirements.lock
# hand-edit requirements.txt to exact versions
```

---

## Progress Tracking

| Phase                          | Items | Done | Blocker? |
| ------------------------------ | ----- | ---- | -------- |
| 1 — Critical Blockers          | 8     | 0    | YES      |
| 2 — Deployment Infrastructure  | 5     | 0    | YES      |
| 3 — Production Hardening        | 6     | 0    | No       |
| 4 — Advanced (optional)         | 6     | 0    | No       |

**Definition of "deployable":** All of Phase 1 + Phase 2 complete. Phase 3 strongly
recommended before real user traffic. Phase 4 as scale demands.
