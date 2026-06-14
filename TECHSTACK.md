# AutiSense-AI — Tech Stack & Hosting Reference

A complete inventory of every technology in the platform, with the configuration details you need to deploy and host each service.

The platform is a **multi-service monorepo** with four runnable services:

| Service | Stack | Default Port | Role |
|---------|-------|--------------|------|
| `frontend/` | Next.js 15 (React 19) | 3000 | Web app / UI |
| `backend/` | NestJS 11 (Node) | 4000 | Main API, auth, orchestration |
| `ml-service/app/` | FastAPI (Python) | 8001 | ML inference (behavior/pose) |
| `ml-service/ai-engine/` | Flask (Python) | 5000 | Emotion detection / camera stream |

Supporting infrastructure: **PostgreSQL** (+ pgvector), **Redis**, optional **Ollama**.

> Note: `backend-express/` and `frontend-vite/` are **legacy** implementations. The active stack is `backend/` (NestJS) and `frontend/` (Next.js). The root `package.json` dev scripts still reference the legacy Express backend — use the per-service commands below instead.

---

## 1. Frontend — `frontend/`

**Framework:** Next.js `15.5.18` (App Router) on React `19.1.0`, TypeScript `5.x`, ESM (`"type": "module"`).

| Category | Library | Version |
|----------|---------|---------|
| Framework | next | 15.5.18 |
| UI runtime | react / react-dom | 19.1.0 |
| Styling | tailwindcss | 4.x (`@tailwindcss/postcss`) |
| Forms | react-hook-form + @hookform/resolvers | 7.78 / 5.4 |
| Validation | zod | 4.4.3 |
| State | zustand | 5.0.13 |
| Animation | framer-motion, gsap, @studio-freight/lenis | 12.38 / 3.15 / 1.0 |
| Charts | recharts | 3.8.1 |
| Icons | lucide-react | 1.14 |
| Camera | react-webcam | 7.2 |
| AI streaming | ai (Vercel AI SDK) + @ai-sdk/react | 6.0 / 3.0 |

### Hosting config
- **Build:** `npm run build` → `npm run start` (Node server). Best on **Vercel** (native Next.js) or any Node host / container.
- **Node:** 20+ recommended (React 19 / Next 15 require Node ≥ 18.18).
- **API proxy:** `next.config.ts` rewrites `/api/v1/*` → `http://localhost:4000/api/v1/*`. **Change this to your deployed backend URL in production** (or set via env-driven rewrite).
- **Image domains** whitelisted in `next.config.ts`: `lh3.googleusercontent.com`, `images.unsplash.com`. Add your CDN/asset hosts here.
- **Env var:** `VITE_API_BASE_URL` (legacy naming) — points at backend `http://localhost:4000/api/v1`. For Next.js public vars use `NEXT_PUBLIC_*`.

---

## 2. Backend — `backend/` (Main API)

**Framework:** NestJS `11` on Node, TypeScript `5.7`. Runs clustered under **PM2** in production.

| Category | Library | Notes |
|----------|---------|-------|
| Core | @nestjs/core, common, platform-express 11 | Express-based |
| ORM | @prisma/client / prisma `5.22.0` | PostgreSQL |
| Auth | @nestjs/jwt, @nestjs/passport, passport-jwt, passport-local | JWT + refresh-token rotation |
| Password hashing | bcryptjs | |
| Validation | class-validator, class-transformer, joi | DTO + env validation |
| Config | @nestjs/config | |
| Queue | @nestjs/bullmq + bullmq | Redis-backed background jobs |
| Cache/Redis | ioredis | |
| Rate limiting | @nestjs/throttler | + custom lockout service |
| API docs | @nestjs/swagger | Swagger/OpenAPI |
| Health | @nestjs/terminus | Health checks |
| Metrics | prom-client | Prometheus `/metrics` |
| Logging | winston + winston-daily-rotate-file | Rotating file logs |
| Email | resend | Transactional email |
| File parsing | pdf-parse, mammoth | PDF / DOCX ingestion |
| AI / RAG | langchain + @langchain/{core,community,groq,google-genai,ollama,textsplitters} | LLM orchestration |
| Misc | cookie-parser, uuid, reflect-metadata, rxjs | |

### LLM providers wired in
- **Groq** (`@langchain/groq`) — primary, via `GROQ_API_KEY`
- **Google Gemini** (`@langchain/google-genai`) — `GEMINI_API_KEY`, model `gemini-2.5-flash`
- **Ollama** (`@langchain/ollama`) — local fallback at `OLLAMA_BASE_URL`

### Hosting config
- **Build:** `npm run build` (`nest build`) → output `dist/`.
- **Start (prod):** `npm run start:prod` (`node dist/src/main.js`) or **PM2**: `npm run start:pm2`.
- **PM2** (`ecosystem.config.js`): cluster mode, `instances: 'max'` in production, `max_memory_restart: 512M`, logs to `logs/`. Use `env_production` profile.
- **Migrations:** run `prisma migrate deploy` (prod) before start; `prisma generate` during build.
- **Port:** `4000`.

### Required env vars (`backend/.env`)
```
DATABASE_URL=postgresql://user:pass@host:5432/autisense
PORT=4000
NODE_ENV=production
JWT_SECRET=<min 32 random chars>
ALLOWED_ORIGINS=https://your-frontend-domain   # comma-separated CORS allowlist

# Account lockout
LOCKOUT_MAX_ATTEMPTS=5
LOCKOUT_DURATION_SECONDS=900

# Redis (BullMQ + cache)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=AutiSense <noreply@yourdomain.com>

# LLM
GROQ_API_KEY=gsk_xxx
GEMINI_API_KEY=xxx
GEMINI_MODEL=gemini-2.5-flash
OLLAMA_BASE_URL=http://localhost:11434

# Python ML gateway
PY_ML_ENABLED=true
PY_ML_BASE_URL=http://127.0.0.1:8001
PY_ML_TIMEOUT_MS=2500

# AI engine (Flask) gateway
AI_ENGINE_ENABLED=false
AI_ENGINE_BASE_URL=http://127.0.0.1:5000
AI_ENGINE_TIMEOUT_MS=3500

# AWS S3 (report storage)
S3_BUCKET=autisense-reports
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_ENDPOINT=            # set for MinIO/LocalStack; leave blank for real S3
S3_FORCE_PATH_STYLE=true

# Feature flags: FF_<NAME>=true|false (see .env.example for full list)
```

---

## 3. Database — PostgreSQL + Prisma

- **Engine:** PostgreSQL with the **pgvector** extension (`ankane/pgvector:v0.5.1` in dev) — needed for embeddings/RAG.
- **ORM:** Prisma `5.22.0`, schema at `backend/prisma/schema.prisma`, datasource provider `postgresql`.
- **Models:** Users, RefreshTokens, Child, ScreeningSession/Result/AnalysisData, Report, Chat, plus SaaS multi-tenancy: Organization, OrganizationMember, Subscription (Stripe fields), ApiKey, WebhookEndpoint, AuditLog.
- **Stripe** is modeled (`stripeCustomerId`, `stripePriceId`, `stripeSubId`) — billing integration is schema-ready.

### Hosting config
- Provision a managed Postgres (RDS, Supabase, Neon, Railway, etc.) — **must support `pgvector`**.
- Set `DATABASE_URL`. Run `npx prisma migrate deploy` on deploy; seed with `npm run prisma:seed` if needed.
- Connection pooling recommended (PgBouncer / provider pooler) since PM2 runs multiple instances.

---

## 4. Cache & Queue — Redis

- **Used for:** BullMQ background jobs (`@nestjs/bullmq`) and caching (`ioredis`).
- **Dev image:** `redis:7-alpine`.
- **Hosting:** managed Redis (ElastiCache, Upstash, Railway). Set `REDIS_HOST` / `REDIS_PORT` (add auth/TLS for production providers).

---

## 5. ML Service — `ml-service/app/` (FastAPI)

**Framework:** FastAPI + Uvicorn (Python ≥ 3.10).

| Library | Purpose |
|---------|---------|
| fastapi, uvicorn[standard] | API server |
| pydantic | Schemas |
| numpy, pandas | Data |
| opencv-python-headless | Computer vision |
| mediapipe | Pose / face landmarks |
| scikit-learn, joblib | ML model train/inference |
| reportlab | PDF report generation |
| ucimlrepo | Dataset loading |

### Hosting config
- **Run:** `uvicorn app.main:app --host 127.0.0.1 --port 8001` (config in `pyproject.toml`).
- Use `opencv-python-headless` (no GUI libs) — suitable for servers/containers.
- Bind `0.0.0.0` behind a reverse proxy for remote access; backend reaches it via `PY_ML_BASE_URL`.
- For production use Gunicorn + Uvicorn workers, or a container with a process manager.
- Trained models live in `ml-service/models/`; ship them with the deploy.

---

## 6. AI Engine — `ml-service/ai-engine/` (Flask, optional)

**Framework:** Flask `3.0.3` + Flask-Cors (Python).

| Library | Purpose |
|---------|---------|
| flask, flask-cors | API server |
| numpy 2.1.1 | Data |
| opencv-python 4.10 | Camera/video (note: **not** headless — needs GUI libs or `xvfb` on servers) |
| mediapipe 0.10.14 | Landmarks |
| deepface 0.0.93 | Emotion detection (pulls TensorFlow) |

### Hosting config
- **Disabled by default** (`AI_ENGINE_ENABLED=false`). Enable only if you need live emotion detection.
- Heavy: `deepface` brings TensorFlow + model weights → large image, more RAM. GPU optional.
- Port `5000`; backend reaches it via `AI_ENGINE_BASE_URL`.
- Uses non-headless `opencv-python` — install system libs (`libgl1`, etc.) or run headless variant on a server.

---

## 7. External Services / APIs

| Service | Used for | Env var |
|---------|----------|---------|
| **Groq** | Primary LLM | `GROQ_API_KEY` |
| **Google Gemini** | Chat assistant LLM | `GEMINI_API_KEY` |
| **Ollama** | Local LLM fallback | `OLLAMA_BASE_URL` |
| **Resend** | Transactional email | `RESEND_API_KEY`, `EMAIL_FROM` |
| **AWS S3** | Report/file storage (S3 or MinIO-compatible) | `S3_*`, `AWS_*` |
| **Stripe** | Billing (schema-ready) | `stripe*` fields on Subscription |

---

## 8. Local Dev Infrastructure (Docker)

`docker-compose.yml` spins up local infra (not app code):

- **postgres** — `ankane/pgvector:v0.5.1`, port 5432, volume `pgdata`
- **redis** — `redis:7-alpine`, port 6379, volume `redis_data`
- **ollama** — `ollama/ollama:latest`, port 11434 (profile `local-ai`, opt-in)

```
docker compose up -d            # postgres + redis
docker compose --profile local-ai up -d   # + ollama
docker compose down -v          # stop and wipe volumes
```

---

## 9. Tooling & Observability

- **Language:** TypeScript 5.x (frontend + backend), Python 3.10+ (ML).
- **Lint/format:** ESLint 9 + Prettier (both Node services), `typescript-eslint`.
- **Testing (backend):** Jest 30 + ts-jest, Supertest for e2e.
- **Process mgr:** PM2 (backend cluster).
- **Metrics:** Prometheus via `prom-client` (backend `/metrics`).
- **Logging:** Winston with daily-rotate files (`backend/logs/`). See `LOGGING_SETUP.md`.
- **Health checks:** `@nestjs/terminus`.
- **API docs:** Swagger (`@nestjs/swagger`).

---

## 10. Suggested Production Topology

```
                    ┌────────────────┐
   Users ─────────► │  Next.js (FE)  │  Vercel / Node host  :3000
                    └───────┬────────┘
                            │ /api/v1/* (rewrite → backend URL)
                            ▼
                    ┌────────────────┐
                    │  NestJS API    │  PM2 cluster / container :4000
                    └───┬───┬───┬────┘
              ┌─────────┘   │   └──────────┐
              ▼             ▼              ▼
       ┌───────────┐  ┌──────────┐  ┌────────────┐
       │ Postgres  │  │  Redis   │  │ FastAPI ML │ :8001
       │ +pgvector │  │ (BullMQ) │  │ (+ Flask   │
       └───────────┘  └──────────┘  │  engine    │ :5000 opt.)
                                     └────────────┘
   External: Groq · Gemini · Resend · AWS S3 · Stripe
```

### Deployment checklist
1. Provision Postgres (with pgvector) + Redis (managed).
2. Set all backend env vars; generate a strong `JWT_SECRET`.
3. `prisma migrate deploy` → build backend → start under PM2 (`env_production`).
4. Deploy FastAPI ML service (ship `models/`); set `PY_ML_BASE_URL` on backend.
5. (Optional) Deploy Flask ai-engine; set `AI_ENGINE_ENABLED=true`.
6. Build & deploy Next.js frontend; point the `/api/v1` rewrite at the live backend.
7. Lock down CORS via `ALLOWED_ORIGINS` to your real frontend domain(s).
8. Configure S3 bucket + IAM creds for report storage.
9. Wire Prometheus scraping to backend `/metrics`; ship Winston logs.
