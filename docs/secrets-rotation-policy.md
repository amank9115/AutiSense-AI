# Secrets Rotation Policy

## Secrets inventory

| Secret | Where used | Rotation frequency |
|--------|-----------|-------------------|
| `JWT_SECRET` | Backend — signs access + refresh tokens | Every 90 days |
| `DATABASE_URL` / `POSTGRES_PASSWORD` | Backend Prisma connection | Every 180 days |
| `REDIS_URL` | Backend BullMQ + cache | Every 180 days |
| `GEMINI_API_KEY` | Backend AI assistant | Every 90 days or on suspected leak |
| `GROQ_API_KEY` | Backend AI fallback | Every 90 days or on suspected leak |
| `RESEND_API_KEY` | Backend email delivery | Every 90 days |
| `STAGING_SSH_KEY` / `PRODUCTION_SSH_KEY` | GitHub Actions deploy | Every 180 days |

## Where secrets live per environment

| Environment | Storage |
|-------------|---------|
| Local dev | `.env` file (git-ignored) |
| Staging | GitHub Actions Environment: `staging` |
| Production | GitHub Actions Environment: `production` |

Never store real values in `.env.example`, source code, or comments.

## Routine rotation procedure

1. Generate the new secret value (use `openssl rand -base64 48` for `JWT_SECRET`).
2. Update the value in the GitHub Environment secrets UI (`Settings → Environments → <env> → Secrets`).
3. For DB/Redis credential changes, update the value in the database server first, then update the secret, then redeploy.
4. Trigger a new deploy — the running container picks up the new secret on restart.
5. Verify the `/health` and `/ready` endpoints return 200 after deploy.
6. Rotating `JWT_SECRET` invalidates all active sessions; inform users of forced re-login before doing this in production.

## Emergency rotation (breach scenario)

1. **Immediately** revoke / regenerate the compromised secret at the source (DB server, API provider dashboard, etc.).
2. Update the GitHub Environment secret.
3. Force-redeploy all affected services: `docker compose -f docker-compose.prod.yml up -d --force-recreate <service>`.
4. Rotate `JWT_SECRET` even if it wasn't compromised — invalidate all sessions as a precaution.
5. Check logs for unauthorized use during the breach window.
6. File an incident report and document the timeline.

## Pre-commit secret scanning

[gitleaks](https://github.com/gitleaks/gitleaks) runs on every commit via `.pre-commit-config.yaml`.
Install the hooks once per clone:

```bash
pip install pre-commit
pre-commit install
```

CI also runs `gitleaks` on every push (see `.github/workflows/ci.yml`).
