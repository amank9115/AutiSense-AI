# ──────────────────────────────────────────────────────────────────────────────
# AutiSense-AI Backend (NestJS) — Production Image
# Multi-stage build: deps → builder → runner
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Prisma needs the schema present when the client is generated during install
COPY prisma ./prisma
RUN npm ci

# ── Stage 2: build the application ────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Strip dev dependencies for a lean runtime node_modules
RUN npm prune --omit=dev

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Run as the built-in non-root "node" user
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 4000

# Liveness against the backend /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||4000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
