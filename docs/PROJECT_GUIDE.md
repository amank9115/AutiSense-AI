# Full Stack Project — Complete Build Guide

> One tool per task. All free. Production-grade.

---

## Tech Stack (Final Picks)

| Layer | Tool | Why |
|---|---|---|
| Frontend framework | **Next.js** | SSR, routing, API routes — all in one |
| Styling | **Tailwind CSS** | Utility-first, no CSS files to manage |
| State management | **Zustand** | Lightweight, no boilerplate |
| Backend framework | **NestJS** | Structured, scalable, TypeScript-native |
| Authentication | **Passport.js** | JWT + OAuth2 strategy, plugs into NestJS |
| ORM | **Prisma** | Type-safe DB queries, auto migrations |
| Primary database | **PostgreSQL** | Relational, encrypted, battle-tested |
| Cache | **Redis** | Session store, rate limiting, hot data |
| Job queue | **BullMQ** | Background jobs built on Redis |
| File storage | **Cloudflare R2** | S3-compatible, free 10 GB/month |
| CDN + security | **Cloudflare** | Free DDoS, SSL, WAF, DNS |
| Email sender | **Resend** | 3,000 free emails/month, simple API |
| API docs | **Swagger (OpenAPI)** | Auto-generated from NestJS decorators |
| Testing | **Jest** | Unit + integration tests, built into NestJS |
| Linting + format | **ESLint + Prettier** | Code quality enforcement |
| Containerization | **Docker** | Consistent environment everywhere |
| CI/CD pipeline | **GitHub Actions** | Free for public + 2,000 min/month private |
| Deployment | **Railway** | Free tier, deploys Docker containers |
| Error tracking | **Sentry** | Free 5k errors/month, full stack traces |
| Monitoring | **Grafana** | Free dashboards for metrics + logs |

---

## System Requirements (Your Machine)

Before writing a single line of code, install these:

```
Node.js        >= 20.x LTS       https://nodejs.org
npm            >= 10.x            (comes with Node)
Docker Desktop latest             https://docker.com/products/docker-desktop
Git            latest             https://git-scm.com
PostgreSQL     >= 15              https://postgresql.org/download (or run via Docker)
Redis          >= 7               https://redis.io/download (or run via Docker)
```

**Recommended editor:** VS Code with these extensions:
- Prisma (prisma.prisma)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Docker (ms-azuretools.vscode-docker)
- GitLens (eamodio.gitlens)

---

## Phase 1 — Project Initialization

### 1.1 Create the monorepo

```bash
mkdir my-fullstack-app
cd my-fullstack-app
git init
```

### 1.2 Bootstrap the frontend (Next.js)

```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 1.3 Bootstrap the backend (NestJS)

```bash
npm install -g @nestjs/cli
nest new backend --package-manager npm
```

### 1.4 Set up shared root tooling

```bash
# Root package.json to run both apps together
npm init -y
npm install --save-dev concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run start:dev --prefix backend\"",
    "build": "npm run build --prefix frontend && npm run build --prefix backend",
    "test": "npm run test --prefix backend"
  }
}
```

---

## Phase 2 — Database Setup

### 2.1 Install Prisma in backend

```bash
cd backend
npm install prisma @prisma/client
npx prisma init
```

### 2.2 Configure database URL

In `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/myapp_db?schema=public"
```

### 2.3 Example Prisma schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  posts        Post[]
}

model Post {
  id        String   @id @default(uuid())
  title     String
  body      String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

### 2.4 Run migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Phase 3 — Authentication

### 3.1 Install auth packages

```bash
cd backend
npm install @nestjs/passport passport passport-jwt passport-local
npm install @nestjs/jwt bcryptjs
npm install -D @types/passport-jwt @types/passport-local @types/bcryptjs
```

### 3.2 Auth flow

```
Register → hash password (bcrypt, rounds=12) → save user → return 201
Login    → validate credentials → issue access token (15min JWT) + refresh token (7d, httpOnly cookie)
Request  → JwtAuthGuard validates Bearer token → attach user to request
Refresh  → validate refresh token from cookie → issue new access token
Logout   → clear httpOnly cookie
```

### 3.3 JWT configuration

In `backend/.env`:
```env
JWT_SECRET=your_super_long_random_secret_min_64_chars
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=another_long_random_secret
REFRESH_TOKEN_EXPIRY=7d
```

### 3.4 Role-based access

```typescript
// Apply to any controller or route handler
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get('admin/dashboard')
getAdminDashboard() { ... }
```

---

## Phase 4 — Redis + BullMQ Setup

### 4.1 Run Redis via Docker

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 4.2 Install BullMQ

```bash
cd backend
npm install @nestjs/bullmq bullmq ioredis
```

### 4.3 Example: Email queue

```typescript
// Dispatch a job (from any service)
await this.emailQueue.add('send-welcome', { userId, email });

// Process the job (in EmailProcessor)
@Process('send-welcome')
async handleWelcomeEmail(job: Job) {
  await this.resend.emails.send({
    from: 'hello@yourdomain.com',
    to: job.data.email,
    subject: 'Welcome!',
    html: '<p>Welcome aboard.</p>',
  });
}
```

---

## Phase 5 — File Storage (Cloudflare R2)

### 5.1 Install AWS S3 SDK (R2 is S3-compatible)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 5.2 R2 environment variables

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=my-app-uploads
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

### 5.3 Upload flow

```
Client → requests presigned URL from backend → backend returns presigned R2 URL →
Client uploads directly to R2 → Client sends back the final file URL → Backend saves URL to DB
```

---

## Phase 6 — Docker Setup

### 6.1 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["node", "dist/main"]
```

### 6.2 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 6.3 docker-compose.yml (local development)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    env_file: ./backend/.env
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file: ./frontend/.env.local
    depends_on:
      - backend

volumes:
  pgdata:
```

Run everything:
```bash
docker compose up --build
```

---

## Phase 7 — CI/CD (GitHub Actions)

### 7.1 `.github/workflows/deploy.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

---

## Phase 8 — Deployment (Railway)

1. Push project to GitHub
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Create services: **Backend**, **Frontend**, **PostgreSQL** (Railway plugin), **Redis** (Railway plugin)
4. Set all environment variables in Railway dashboard (same as your `.env`)
5. Railway auto-detects Dockerfile and builds
6. Connect your Cloudflare domain → Railway provides a public URL

---

## Phase 9 — Security Checklist

```
[x] All secrets in environment variables — never committed to git
[x] .env files listed in .gitignore
[x] bcrypt with cost factor >= 12 for password hashing
[x] JWT stored in memory (frontend), refresh token in httpOnly Secure cookie
[x] All routes protected by JwtAuthGuard unless explicitly @Public()
[x] Input validated with class-validator DTOs on every endpoint
[x] Helmet.js enabled on NestJS app (sets security headers)
[x] CORS configured — only allow your frontend's domain
[x] Rate limiting on auth routes (login, register, forgot-password)
[x] Parameterized queries only — Prisma handles this by default
[x] HTTPS everywhere — Cloudflare handles SSL termination
[x] Cloudflare WAF enabled on the free plan
[x] PostgreSQL SSL connection enabled in production
[x] Redis password-protected in production
[x] Sentry initialized in both frontend and backend
```

---

## Phase 10 — Monitoring

### Sentry setup (backend)

```bash
npm install @sentry/nestjs @sentry/profiling-node
```

```typescript
// In main.ts, before NestFactory.create()
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Sentry setup (frontend)

```bash
npx @sentry/wizard@latest -i nextjs
```

---

## Environment Variables Master List

### backend/.env
```env
# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/myapp_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=min_64_char_random_string
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=another_min_64_char_random_string
REFRESH_TOKEN_EXPIRY=7d

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Email
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Key Commands Reference

```bash
# Development
npm run dev                          # Start both frontend + backend
npx prisma studio                    # Visual DB browser
npx prisma migrate dev --name xyz    # Create + apply new migration
docker compose up                    # Start all services

# Testing
npm test                             # Run all Jest tests
npm run test:e2e                     # Run end-to-end tests
npm run test:cov                     # Coverage report

# Production build
npm run build                        # Build both apps
docker compose -f docker-compose.prod.yml up --build

# Database
npx prisma db seed                   # Seed initial data
npx prisma migrate deploy            # Apply migrations in production
```
