# Contributing to AutiSense AI

## Branch naming

| Prefix | When to use |
|--------|------------|
| `feat/` | New feature or enhancement |
| `fix/` | Bug fix |
| `chore/` | Tooling, dependencies, config |
| `docs/` | Documentation only |

Example: `feat/gaze-calibration-v2`, `fix/auth-refresh-race`

## Commit format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

Examples:
```
feat(screening): add pause-resume support for video sessions
fix(auth): prevent refresh token reuse after rotation
chore(deps): pin multer to 2.2.0 to resolve HIGH vuln
```

## Pull request flow

1. Fork the repo (external contributors) or create a branch (team members).
2. Open a PR against `main`.
3. CI must pass — all jobs in `ci.yml` green.
4. At least 1 reviewer approval required.
5. Squash-merge is preferred for feature branches; merge commit for release branches.

## Test requirements

| Layer | Requirement |
|-------|------------|
| Backend | ≥70% coverage on `auth` and `screening` modules (`npm run test:cov`) |
| Frontend | No regressions in existing component tests |
| ML Service | `pytest ml-service/tests/` passes |
| All | `npm audit --audit-level=high` returns 0 issues |

## Local development setup

```bash
# Start infrastructure (DB + Redis)
docker compose up -d postgres redis

# Backend
cd backend
cp .env.example .env   # fill in values
npm install --legacy-peer-deps
npx prisma migrate dev
npm run start:dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install --legacy-peer-deps
npm run dev

# ML Service (separate terminal)
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Code style

| Layer | Tooling |
|-------|---------|
| Backend | ESLint + Prettier (`npm run lint`, `npm run format`) |
| Frontend | ESLint + Prettier (`npm run lint`, `npm run format`) |
| ML Service | ruff (`ruff check .`, `ruff format .`) |

Run linters before pushing. CI will reject lint failures.

## Secret hygiene

Never commit real secrets. Use `.env` locally (git-ignored).
Install the pre-commit hooks to catch accidental leaks:

```bash
pip install pre-commit
pre-commit install
```
