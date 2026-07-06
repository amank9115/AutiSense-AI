# Deployment Guide

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Docker + Docker Compose | 24.x |
| Node.js | 22.x |
| Python | 3.11+ |
| PostgreSQL (with pgvector) | 15+ |
| Redis | 7+ |

For managed deploys (recommended) you only need Docker — Postgres and Redis run inside Docker Compose.

## Service resource requirements

| Service | CPU | RAM | Notes |
|---------|-----|-----|-------|
| Backend (NestJS) | 0.5 vCPU | 512 MB (limit 1 GB) | Runs Prisma, BullMQ, JWT |
| Frontend (Next.js) | 0.25 vCPU | 256 MB (limit 512 MB) | Standalone output |
| ML Service (FastAPI) | 1 vCPU | 1 GB (limit 4 GB) | MediaPipe CV at inference time |
| PostgreSQL (pgvector) | 0.5 vCPU | 512 MB | Increase for large datasets |
| Redis | 0.1 vCPU | 128 MB | BullMQ queues + cache |

## Environment variables

### Root `.env` (shared / Docker Compose)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `POSTGRES_USER` | Yes | `postgres` | |
| `POSTGRES_PASSWORD` | Yes | `<strong-password>` | |
| `POSTGRES_DB` | Yes | `autisense` | |
| `DATABASE_URL` | Yes | `postgresql://postgres:<pw>@postgres:5432/autisense?schema=public` | Must match Postgres creds |
| `JWT_SECRET` | **Yes** | `<openssl rand -base64 48>` | Min 32 chars |
| `REDIS_URL` | Yes | `redis://redis:6379` | |
| `ALLOWED_ORIGINS` | Yes | `https://app.autisense.ai` | Comma-separated |

### Backend additional

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | Yes | `production` | |
| `PORT` | No | `4000` | |
| `PY_ML_ENABLED` | No | `true` | Set `false` to disable ML gateway |
| `PY_ML_BASE_URL` | No | `http://ml-service:8001` | |
| `GEMINI_API_KEY` | No | — | AI assistant feature |
| `GROQ_API_KEY` | No | — | AI fallback |
| `RESEND_API_KEY` | No | — | Email delivery |
| `METRICS_TOKEN` | No | — | Bearer token to protect `/metrics` endpoint |

### Frontend additional

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | Yes | `production` | |
| `PORT` | No | `3000` | |
| `BACKEND_URL` | Yes | `http://backend:4000` | Server-side proxy target |
| `NEXT_PUBLIC_API_BASE_URL` | No | `` (empty) | Leave empty to use Next.js proxy |

### ML Service additional

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `PORT` | No | `8001` | |
| `REDIS_URL` | No | `redis://redis:6379` | Session TTL |
| `LOG_FORMAT` | No | `json` | |
| `ML_ALLOWED_ORIGINS` | No | `http://backend:4000` | |

## First-time deploy

```bash
# 1. Clone and enter the repo
git clone <repo-url> autisense && cd autisense

# 2. Configure secrets
cp .env.example .env
# Edit .env — fill in all Required fields above.
# Generate JWT_SECRET:
#   openssl rand -base64 48

# 3. Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# 4. Run database migrations (first deploy only)
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy

# 5. (Optional) seed reference data
docker compose -f docker-compose.prod.yml exec backend \
  npx ts-node -r tsconfig-paths/register prisma/seed.ts

# 6. Verify health
curl -s http://localhost:4000/health   # {"status":"ok"}
curl -s http://localhost:4000/ready    # {"status":"ok"}
curl -s http://localhost:3000/         # HTTP 200
curl -s http://localhost:8001/health   # {"status":"ok"}
```

## Subsequent deploys

```bash
git pull origin main

# Rebuild changed images and restart containers
docker compose -f docker-compose.prod.yml up -d --build

# Apply any new migrations
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy
```

## Health check URLs

| Service | Endpoint | Expected response |
|---------|----------|------------------|
| Backend | `GET /health` | `{"status":"ok"}` |
| Backend | `GET /ready` | `{"status":"ok"}` |
| Frontend | `GET /` | HTTP 200 |
| ML Service | `GET /health` | `{"status":"ok"}` |

## SSL/TLS configuration

Terminate TLS at a reverse proxy in front of the Docker stack. Example nginx config:

```nginx
server {
    listen 80;
    server_name app.autisense.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.autisense.ai;

    ssl_certificate     /etc/letsencrypt/live/app.autisense.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.autisense.ai/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.autisense.ai;

    ssl_certificate     /etc/letsencrypt/live/api.autisense.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.autisense.ai/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        proxy_pass         http://127.0.0.1:4000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Use [Certbot](https://certbot.eff.org/) to obtain and auto-renew Let's Encrypt certificates.

## Rollback procedure

### Application rollback (no schema change)

```bash
# Find the previous image tag (SHA) from GHCR or git log
PREV_TAG=<sha>

# Update images and restart
docker compose -f docker-compose.prod.yml pull
IMAGE_TAG=$PREV_TAG docker compose -f docker-compose.prod.yml up -d
```

### Application + database rollback (schema changed)

```bash
# 1. Mark the migration as rolled back in Prisma's history
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate resolve --rolled-back <migration_name>

# 2. Roll back the schema manually (Prisma doesn't auto-revert)
#    Apply the inverse SQL from prisma/migrations/<migration_name>/migration.sql

# 3. Redeploy the previous application version
IMAGE_TAG=$PREV_TAG docker compose -f docker-compose.prod.yml up -d
```

> Always keep a PostgreSQL backup before applying migrations. See backup procedure below.

## Backup and restore

```bash
# Backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres autisense | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup-<date>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres autisense
```

## Troubleshooting

**DB connection refused**
- Check `DATABASE_URL` matches `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`.
- Confirm the `postgres` container is healthy: `docker compose ps`.
- If the container exits immediately, check logs: `docker compose logs postgres`.

**Redis timeout**
- Confirm `REDIS_URL` is `redis://redis:6379` (not localhost) inside Docker.
- Check the `redis` container is healthy: `docker compose ps`.

**ML model not loading**
- The model trains at Docker build time (`train_model.py`). If the build skipped training, rebuild: `docker compose -f docker-compose.prod.yml build --no-cache ml-service`.
- Check logs: `docker compose logs ml-service`.
- Confirm memory limit is at least 1 GB — MediaPipe fails silently under memory pressure.

**Frontend shows blank page after deploy**
- Check `BACKEND_URL` is reachable from the frontend container (use the internal Docker service name `http://backend:4000`).
- Check backend logs for startup errors: `docker compose logs backend`.
