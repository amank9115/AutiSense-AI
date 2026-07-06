# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Phase 3 production hardening: Grafana dashboard JSON, monitoring guide, Sentry integration docs
- Automated daily PostgreSQL backup workflow to S3 with 30-day retention
- ML service test suite: 20+ pytest tests covering health, predict/window, predict/live, input validation
- Backend `screening.service.spec.ts` — unit tests for createSession, saveResult, deleteSession, getUserSessions
- Jest coverage threshold (≥70% on auth + screening modules)
- Frontend `robots.ts` and `sitemap.ts` (Next.js App Router route handlers)
- Full Open Graph + Twitter Card metadata in root `layout.tsx`
- `global-error.tsx` for root-layout error boundary
- Request timeout (15 s) + `AbortController` in `frontend/src/api/client.ts`

### Changed
- `ci.yml`: added `npm audit --audit-level=high` gate to backend and frontend jobs
- `ci.yml`: added `npm run test:cov` coverage run to backend job
- `ci.yml`: added `pytest tests/` step to ml-service job

---

## [0.5.0] — 2026-07-07

### Added
- Phase 2 deployment infrastructure:
  - `.gitleaks.toml` + `.pre-commit-config.yaml` (secret scanning)
  - `docs/secrets-rotation-policy.md`
  - `docs/DEPLOYMENT.md` (full production deployment guide)
  - `deploy.yml` GitHub Actions workflow (GHCR build → staging → production)
  - `rollback.yml` manual rollback workflow
  - `backup.yml` daily PostgreSQL backup
  - `MetricsAuthGuard` protecting `/metrics` behind `METRICS_TOKEN`
  - `LICENSE` (MIT), `CONTRIBUTING.md`, PR template, issue templates

### Changed
- `backend/src/main.ts`: Swagger gated to `NODE_ENV !== 'production'`
- `backend/src/main.ts`: CSP `'unsafe-inline'` removed from `scriptSrc` in production
- `frontend/next.config.ts`: `BACKEND_URL` env var for server-side proxy

---

## [0.4.0] — 2026-07-07

### Added
- Phase 1 deployment readiness:
  - Dockerfiles for backend, frontend, and ML service (multi-stage, non-root)
  - `docker-compose.prod.yml` wiring all services
  - Database migration `20260707001856_add_phase2_through_phase5_models` (12 tables)
  - `requirements.txt` pinned to exact versions
  - `train_model.py` runs at Docker build time (ML model artifact strategy)
- Security vulnerability fixes: `multer@2.2.0` override (backend), `postcss` + `js-yaml` overrides (frontend)
- `next.config.ts`: fixed `optimizePackageImports` placement under `experimental`
- Prisma migrations directory tracked in version control (removed from `.gitignore`)

---

## [0.3.0] — 2026-06 (approximate)

### Added
- Phase 4/5 features: screening pause-resume, camera quality meter, a11y pass
- Frontend design-system pass: design tokens, nested layouts, React Hook Form, accessibility
- Screening: longitudinal analysis service, treatment planning service
- Backend: report sharing to doctor dashboard, PDF generation, circuit breaker

### Fixed
- ESLint errors blocking CI in backend
- TypeScript build errors in NestJS backend

---

## [0.2.0] — 2026-06 (approximate)

### Added
- Major backend and frontend feature update
- ML service drift detection, experiment manager, feedback engine
- Doctor dashboard with report review workflow
- Winston structured logging, global exception filter, correlation IDs

---

## [0.1.0] — Initial release

### Added
- NestJS backend with JWT authentication, RBAC, rate limiting, Helmet, CORS
- Next.js 15 App Router frontend with React Query caching
- FastAPI ML service with MediaPipe gaze analysis, Pydantic validation, Prometheus metrics
- PostgreSQL + Prisma schema (876 lines, 33 tables)
- Redis caching and BullMQ queue support
- Feature flags (10 flags, Redis-cached, env overrides)
- Health endpoints: `/health`, `/ready` (backend), `/health` (ML)

[Unreleased]: https://github.com/amank9115/autism-screening-platform/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/amank9115/autism-screening-platform/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/amank9115/autism-screening-platform/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/amank9115/autism-screening-platform/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/amank9115/autism-screening-platform/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/amank9115/autism-screening-platform/releases/tag/v0.1.0
