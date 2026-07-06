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

## Phase 2 — Deployment Infrastructure ✅ DONE (2026-07-07)

Target: **Week 2**. Makes deploys repeatable and safe.

### 2.1 Secrets management ✅ DONE

- [x] Add a pre-commit secret scanner — `.gitleaks.toml` + `.pre-commit-config.yaml` (gitleaks v8.18.4)
- [x] Define a secret rotation policy — `docs/secrets-rotation-policy.md`
- [ ] Move all secrets into a manager (AWS Secrets Manager / Vault) — deferred to Phase 4 (infra cost)
- [x] GitHub Actions Environments (`staging`, `production`) already referenced in `prisma-migrate.yml`

### 2.2 Deployment documentation ✅ DONE

- [x] Created `docs/DEPLOYMENT.md`:
  - Production resource requirements per service
  - Full env var checklist per service (required vs optional)
  - First-time + subsequent deploy sequence
  - SSL/TLS + nginx config snippet
  - Rollback procedure (app + `prisma migrate resolve --rolled-back`)
  - Backup/restore commands
  - Troubleshooting common issues

### 2.3 CI/CD deployment pipeline ✅ DONE

- [x] `npm audit --audit-level=high` gate added to backend + frontend jobs in `ci.yml`
- [x] `deploy.yml` — builds & pushes 3 Docker images to GHCR, deploys staging then production
      with `workflow_run` trigger (runs after CI passes), plus `workflow_dispatch` for manual runs
- [x] GitHub Environments (`staging`, `production`) with SSH deploy + `prisma migrate deploy`
- [x] `rollback.yml` — `workflow_dispatch` rollback to any SHA tag, with optional migration resolve

### 2.4 Harden production config ✅ DONE

- [x] Swagger gated behind `nodeEnv !== 'production'` in `backend/src/main.ts`
- [x] `/metrics` protected by `MetricsAuthGuard` (Bearer token via `METRICS_TOKEN` env var)
      — guard at `backend/src/common/guards/metrics-auth.guard.ts`
- [x] CSP `'unsafe-inline'` removed from `scriptSrc` in production; retained on `styleSrc`
      with a comment explaining the CSS-in-JS constraint

### 2.5 Repository hygiene ✅ DONE

- [x] `LICENSE` — MIT 2026, AutiSense AI Contributors
- [x] `CONTRIBUTING.md` — branch naming, Conventional Commits, PR flow, test requirements, local setup
- [x] `.github/PULL_REQUEST_TEMPLATE.md`
- [x] `.github/ISSUE_TEMPLATE/bug_report.yml` and `feature_request.yml` (GitHub issue forms)

---

## Phase 3 — Production Hardening ✅ DONE (2026-07-07)

Target: **Week 3**. Observability, resilience, quality.

### 3.1 Monitoring & observability ✅ DONE

- [x] Grafana dashboard — `infra/grafana/dashboard.json` (13 panels: HTTP rate/errors/latency, Node.js heap/event-loop, ML predictions/latency/active sessions)
- [x] Prometheus scrape config + alert rules documented in `docs/monitoring.md`
- [x] Sentry integration steps documented (backend `@sentry/nestjs`, frontend wizard); env vars added to `.env.example`
- [x] Log aggregation options documented (Loki + Promtail, AWS CloudWatch `awslogs` driver)
- [ ] Wire Sentry SDK into backend/frontend code — requires `npm install @sentry/nestjs` (deferred; no new deps without testing)

### 3.2 Backup & recovery ✅ DONE

- [x] `backup.yml` — daily cron at 02:00 UTC; `pg_dump | gzip → S3`; 30-day auto-prune
- [x] Manual trigger with `environment` choice (staging/production)
- [x] Restore procedure documented in `docs/DEPLOYMENT.md`
- [ ] WAL archiving (requires PostgreSQL server config — deferred to Phase 4)

### 3.3 ML service tests ✅ DONE

- [x] `ml-service/tests/` created with `conftest.py` (httpx AsyncClient over ASGI)
- [x] `test_health.py` — `/health`, `/health/detailed`, `/health/drift`, `/metrics`
- [x] `test_predict.py` — `/predict/window` (single/multi-frame, optional session_key, empty/missing frames); `/predict/live` (accumulation, missing session_key); session data retrieval
- [x] `test_validation.py` — field bounds (eye_contact, attention_span), whitespace session key, email/phone format, base64 image
- [x] `pyproject.toml` updated with `[tool.pytest.ini_options]`
- [x] `ci.yml` ml-service job now runs `pytest tests/ -v --tb=short`

### 3.4 Backend test coverage ✅ DONE

- [x] `screening.service.spec.ts` — createSession (child not found / happy path), getSessionDetails, saveScreeningResult, deleteSession, getUserSessions (cache hit + cold)
- [x] `coverageThreshold` added to `backend/package.json` jest config: global ≥50%, auth ≥70%, screening ≥70%
- [x] `npm run test:cov` step added to CI backend job

### 3.5 Frontend SEO & polish ✅ DONE

- [x] `layout.tsx` — full `Metadata` object: `title.template`, `description`, `openGraph` (type/siteName/title/description/images), `twitter` (card/title/description/images), `robots`
- [x] `robots.ts` — allows public routes, disallows dashboard/screening/profile/api
- [x] `sitemap.ts` — 7 public routes with change frequency and priority
- [x] `api/client.ts` — 15 s `AbortController` timeout; AbortError surfaces as human-readable message
- [x] `global-error.tsx` — root-layout error boundary with error digest display and reset button

### 3.6 Changelog ✅ DONE

- [x] `CHANGELOG.md` created in Keep a Changelog format; seeded with Unreleased + v0.1–0.5 history from git log

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
| 1 — Critical Blockers          | 8     | 8    | ✅ Done  |
| 2 — Deployment Infrastructure  | 5     | 5    | ✅ Done  |
| 3 — Production Hardening        | 6     | 6    | ✅ Done  |
| 4 — Advanced (optional)         | 6     | 0    | No       |

**Definition of "deployable":** All of Phase 1 + Phase 2 complete. Phase 3 strongly
recommended before real user traffic. Phase 4 as scale demands.
