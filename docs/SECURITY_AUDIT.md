# Security Audit — AutiSense AI (Autism Screening Platform)

**Date:** 2026-06-24
**Scope:** NestJS backend (`backend/src`) — static code review of authN/authZ, multi-tenancy,
injection, SSRF, file handling, secrets, PHI handling, and dependencies.
**Context:** Multi-tenant SaaS handling children's health data (PHI), which raises the impact of
any access-control flaw.

> Findings marked **[FIXED]** were remediated in the same pass as this audit. See
> _Remediation applied_ at the end for the exact code changes.

---

## Summary

| Severity | Count | Open | Fixed |
|----------|-------|------|-------|
| 🔴 Critical | 1 | 0 | 1 |
| 🟠 High | 4 | 3 | 1 |
| 🟡 Medium | 6 | 6 | 0 |
| ⚪ Low | 6 | 6 | 0 |

The codebase is **above average** for security hygiene: refresh-token rotation with family-reuse
revocation, API-key hashing, ownership checks on screening data, a strict global validation pipe,
Helmet, and no committed secrets. Findings concentrate in **broken access control** and **SSRF**.

---

## 🔴 Critical

### C1 — Privilege escalation: any *doctor* could promote any user to `super_admin` **[FIXED]**
**File:** `backend/src/users/users.controller.ts` (`updateUserRole`, `listUsers`, `getUserById`)

The role-management endpoints were gated by `@Roles(Role.doctor)` (comments said "admin only").
Any account with `role = doctor` could call `PUT /api/v1/users/<anyUserId>/role` with
`{ "role": "super_admin" }` — including their own id — and could enumerate all users
(`GET /api/v1/users`). `AdminController` correctly used `@Roles(Role.super_admin)`, confirming the
`doctor` gate was a mistake.

**Impact:** Full authorization bypass / takeover of the entire tenant base.
**Fix applied:** Gate changed to `@Roles(Role.super_admin)` on all three routes; self-role-change
blocked; every role change written to the audit log.

---

## 🟠 High

### H1 — Server-Side Request Forgery via webhooks **[FIXED]**
**File:** `backend/src/webhooks/webhooks.service.ts`, `dto/register-webhook.dto.ts`

`@IsUrl({ require_tld: false })` accepted any URL (`http://169.254.169.254`, `http://localhost:6379`,
…) and the server `fetch()`ed it. The `test` endpoint returned the HTTP status code — a working SSRF
oracle for internal port-scanning, cloud metadata, Redis/DB, and the ML/AI services.

**Fix applied:** New `assertSafeWebhookUrl()` enforces `https`-only and blocks private/loopback/
link-local/CGNAT/multicast ranges (IPv4 + IPv6), resolving DNS and rejecting any resolved private
address. Enforced at registration **and** re-checked at delivery (DNS-rebinding defense);
`redirect: 'manual'` prevents redirect-based bypass.
**Follow-up:** Consider also tightening the DTO to `@IsUrl({ protocols: ['https'], require_protocol: true })`
and routing webhook egress through a dedicated proxy/allowlist.

### H2 — Vulnerable dependencies (9 high, 1 moderate) **[OPEN]**
`npm audit` (prod deps):
- **multer <2.2.0** — DoS via deeply nested field names (GHSA-72gw-mp4g-v24j)
- **form-data <4.0.6** — CRLF injection (GHSA-hmw2-7cc7-3qxx)
- **@nestjs/core / platform-express / swagger / terminus / bullmq** chain — high
- **js-yaml ≤4.1.1** — quadratic-complexity DoS (moderate)

**Fix:** `npm audit fix` (review `--force` for the Nest chain), re-test, add `npm audit` to CI.

### H3 — Unauthenticated Prometheus metrics endpoint **[OPEN]**
**File:** `backend/src/metrics/metrics.controller.ts` — `GET /metrics` has no guard.
Exposes route inventory, latencies, traffic volume, and error rates publicly.
**Fix:** Bind to an internal interface or protect with an auth guard / scrape credential / network policy.

### H4 — Email-verification bypass + weak-secret fallback gated only by `NODE_ENV` **[FIXED]**
**Files:** `backend/src/config/configuration.ts`, `backend/src/auth/auth.service.ts`
(`devVerifyEmail`)

Both protections triggered only on `NODE_ENV === 'production'`, so a deploy with `NODE_ENV` unset or
set to `staging` silently shipped a public "verify any email" endpoint **and** a hardcoded JWT secret
(→ token forgery).

**Fix applied:** Both now **fail closed** — the insecure dev path is permitted only when `NODE_ENV`
is *explicitly* `development` or `test`. Any other value (including unset) requires a real, strong
`JWT_SECRET` or the app refuses to boot, and disables the dev verify endpoint.

---

## 🟡 Medium (open)

### M1 — IDOR on AI chat sessions
`ai/ai.service.ts` `streamChat` / `POST /ai/chat/:sessionId` look up `chatSession` by id with **no
owner check** — any authenticated user can read/post to another user's chat. Also un-throttled
(each call hits an LLM → cost/DoS).
**Fix:** Scope `chatSession` to the owner (403 on mismatch); add throttling.

### M2 — AI ingest: confused-deputy + missing ownership
`ai/document.processor.ts:50` does `fs.readFileSync(fileUrl)` on a value validated only as
`@IsUrl()`, and `documentId` ownership is never verified. Not directly exploitable today (a URL
won't resolve as a local path) but brittle.
**Fix:** Separate remote vs local handling explicitly; verify `documentId` ownership; never
`readFileSync` a user-supplied string.

### M3 — CSP allows `'unsafe-inline'` scripts; Swagger always on
`main.ts` — `scriptSrc: ["'self'", "'unsafe-inline'"]` defeats much of CSP's XSS protection;
`SwaggerModule.setup` runs unconditionally (full API schema public in prod).
**Fix:** Drop `'unsafe-inline'` (use nonces/hashes); gate Swagger behind `NODE_ENV !== 'production'`
or auth.

### M4 — Clinician PII exposure
`users.service.findDoctors` returns **every** doctor/clinician's email to any authenticated user
(`GET /api/v1/users/doctors`).
**Fix:** Return `{ id, name }` only; resolve email server-side during share.

### M5 — Targeted account-lockout DoS + fail-open
`auth/lockout.service.ts` keys lockout by email only → an attacker can lock a victim out with 5 bad
logins; lockout is skipped entirely if Redis is down.
**Fix:** Combine with per-IP limiting; prefer CAPTCHA over hard lockout; decide a fail-closed posture
for auth-critical paths.

### M6 — `auth` throttler defined but never used
`app.module.ts` defines a stricter `auth` limiter (50/5min) that no route applies; login falls back
to the global 100/min/IP (brute-force is bounded mainly by the per-email lockout).
**Fix:** Apply `@Throttle({ auth: {...} })` to `login` / `refresh` / `reset-password`.

---

## ⚪ Low (open)

- **L1** Reset-password policy (8 chars) is weaker than register (10) — `reset-password.dto.ts`. Unify.
- **L2** Email-verification & password-reset tokens stored in **plaintext** in the DB. Hash at rest
  (SHA-256), like refresh tokens already are.
- **L3** User enumeration: `register` returns "Email already registered"; `validateUser` skips bcrypt
  when the user is missing (timing oracle). Use a dummy-hash compare + generic messaging.
- **L4** Webhook retries use in-memory `setTimeout` recursion — lost on restart, can pile up
  (reliability; code comments already note BullMQ is the intended path).
- **L5** `GET /api/v1/storage/metadata/:key` lacks the ownership check the download/delete routes have
  (storage is a stub today, so low impact).
- **L6** `RolesGuard` is exact-match with no hierarchy, so `super_admin` is *denied* on
  `@Roles(doctor)` routes — a governance smell that contributed to C1.

---

## What's already solid

Refresh-token rotation with family-reuse revocation + hashed storage · API-key hashing & org-scoping ·
screening/session ownership checks (`verifySessionOwnership`) · strict global `ValidationPipe`
(`whitelist` + `forbidNonWhitelisted`, blocks mass-assignment) · profile-update field whitelisting ·
Helmet · CORS allowlist · bcrypt password hashing · no secrets committed & correct `.gitignore` ·
HTTP logger doesn't log bodies/headers/tokens · `AdminController` correctly `super_admin`-gated.

---

## Recommended order of remediation

1. ✅ **C1** role-guard fix (done)
2. ✅ **H4** fail-closed secret + dev endpoint (done)
3. ✅ **H1** webhook SSRF guard (done)
4. **H2** `npm audit fix` + CI gate
5. **H3 / M3** lock down `/metrics` and Swagger
6. **M1** chat-session ownership

---

## Remediation applied (this pass)

| Finding | Files changed | Change |
|---------|---------------|--------|
| C1 | `users/users.controller.ts`, `users/users.module.ts` | `@Roles(Role.super_admin)` on the three user-management routes; block self-role-change; audit-log every role change (wired `AuditModule`). |
| H4 | `config/configuration.ts`, `auth/auth.service.ts` | JWT secret + `dev-verify-email` now fail closed — insecure path only when `NODE_ENV` is explicitly `development`/`test`. |
| H1 | `webhooks/webhooks.service.ts` | `assertSafeWebhookUrl()` — https-only, blocks private/loopback/link-local/CGNAT/multicast (IPv4+IPv6) with DNS resolution; enforced at register + delivery; `redirect: 'manual'`. |

All changes verified with `npx nest build` (exit 0).
