<p align="center">
  <img src="frontend/public/illustrations/manassaathi-logo.png" alt="AutiSense-AI Logo" width="120" />
</p>

<h1 align="center">AutiSense-AI</h1>

<p align="center">
  <strong>AI-Enabled Autism Screening Platform</strong><br/>
  Real-time behavioral analysis · ML risk prediction · Clinical-grade reports
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
</p>

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js 15    │────▶│    NestJS API    │────▶│  FastAPI + ML   │
│   (frontend/)   │     │   (backend/)     │     │  (ml-service/)  │
│                 │     │                  │     │                 │
│  • Camera UI    │     │  • Auth (JWT)    │     │  • scikit-learn │
│  • Dashboards   │     │  • REST API      │     │  • MediaPipe    │
│  • Charts       │     │  • Prisma ORM    │     │  • PDF Reports  │
│  • AI Assistant │     │  • Redis Cache   │     │  • OpenCV       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                        ┌───────┴────────────┐
                        │ PostgreSQL + pgvector │
                        └─────────────────────┘
```

---

## 📂 Project Structure

```
AutiSense-AI/
│
├── .github/workflows/ci.yml       # CI pipeline (lint → build → check)
│
├── frontend/                       # Next.js 15 (App Router) + React 19 + TS + Tailwind v4
│   ├── src/
│   │   ├── app/                    # App Router routes — (auth) group, screening, results,
│   │   │                           #   parent/doctor dashboards, per-segment error.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # Design-token primitives (Button, Card, Alert, RiskBadge…)
│   │   │   ├── ai/                 # ML overlay components
│   │   │   ├── camera/             # Camera preview + analysis
│   │   │   ├── charts/             # Behavioral analytics (Recharts)
│   │   │   ├── chat/               # AI agent chat
│   │   │   ├── layout/             # Navbar, Footer, sidebars
│   │   │   └── ...                 # auth, effects, common, etc.
│   │   ├── hooks/                  # Custom hooks (useProtectedQuery…)
│   │   ├── context/                # Auth, Screening contexts
│   │   ├── store/                  # Zustand store (auth, theme, accessibility)
│   │   ├── services/ + api/        # API clients (fetch + TanStack Query)
│   │   ├── lib/                    # Utilities (queryClient, screeningProgress…)
│   │   └── types/                  # TypeScript definitions
│   └── public/                     # Static assets
│
├── backend/                        # NestJS 11 + Prisma + PostgreSQL + Redis
│   ├── prisma/                     # Prisma schema, migrations, seed
│   └── src/
│       ├── main.ts                 # Nest bootstrap (CORS, pipes, Swagger)
│       ├── auth/                   # JWT auth, refresh tokens, lockout
│       ├── ml/                     # Proxy/gateway to Python ML service
│       ├── ai/                     # LangChain assistant + document ingest
│       ├── screening/              # Sessions, results, doctor sharing, statistics
│       ├── appointments/ analytics/ fhir/ gdpr/   # Domain modules
│       ├── users/ tenant/ webhooks/ rate-limits/  # + audit, api-keys, gamification
│       └── common/                 # Filters, interceptors, exceptions
│
├── ml-service/                     # Python FastAPI + OpenCV ML service (:8001)
│   ├── app/
│   │   ├── main.py                 # FastAPI entry (/health, /predict/live, /predict/window)
│   │   ├── gaze_analyzer.py        # Eye-contact / gaze scoring
│   │   ├── diagnosis_support.py    # Risk scoring + recommendations
│   │   ├── session_store.py        # Per-session frame aggregation
│   │   ├── model_registry.py       # Model versioning + registry
│   │   ├── training_pipeline.py    # Retraining pipeline
│   │   └── ...                     # drift detection, experiments, metrics
│   ├── ai-engine/                  # Computer-vision modules
│   │   ├── behavior_analysis.py
│   │   ├── emotion_detection.py
│   │   └── metrics_engine.py
│   └── models/                     # Trained artifacts (gitignored)
│
├── docs/                           # Reference documentation
├── docker-compose.yml              # Local PostgreSQL (pgvector) + Redis + Ollama
├── .editorconfig                   # Consistent formatting
├── .env.example                    # All env vars documented
└── package.json                    # Root scripts (concurrently)
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18 &nbsp;|&nbsp; **Python** ≥ 3.10 &nbsp;|&nbsp; **PostgreSQL** (with pgvector — local via `docker compose up -d`)

### 1. Clone & Install

```bash
git clone https://github.com/amank9115/AutiSense-AI.git
cd AutiSense-AI

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the reference env file and fill in your values
cp .env.example backend/.env
cp .env.example frontend/.env
```

Edit `backend/.env` with your PostgreSQL `DATABASE_URL` and optional API keys.

### 3. Start All Services

```bash
npm run dev
```

This starts all three services concurrently:

| Service       | URL                        | Color   |
|---------------|----------------------------|---------|
| **Frontend**  | http://localhost:3000       | 🟦 Cyan    |
| **Backend**   | http://localhost:4000       | 🟩 Green   |
| **ML Service**| http://localhost:8001       | 🟪 Magenta |

Or start individually:

```bash
npm run dev:frontend    # Next.js dev server  (:3000)
npm run dev:backend     # NestJS API          (:4000)
npm run dev:ml          # FastAPI ML service   (:8001)
```

---

## 🤖 AI & ML Features

| Feature | Technology | Description |
|---------|-----------|-------------|
| **Live Camera Screening** | MediaPipe + OpenCV | Real-time behavioral analysis |
| **Risk Prediction** | scikit-learn | ASD risk scoring on AQ-10 scale |
| **Emotion Detection** | Computer Vision | Facial expression analysis |
| **AI Assistant** | Gemini API | Contextual guidance for parents |
| **PDF Reports** | ReportLab | Clinical-grade screening reports |

---

## 📡 API Endpoints (selected)

> The frontend proxies `/api/v1/*`, `/ml/*` and `/ai/*` to the backend (see `frontend/next.config.ts`).

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/auth/register` | New user registration |
| POST | `/api/v1/auth/google` | Google OAuth login |
| POST | `/api/v1/auth/refresh` | Rotate access token (httpOnly refresh cookie) |

### Screening & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/screening/sessions` | Create a screening session |
| POST | `/api/v1/screening/sessions/:id/results` | Persist analysis results |
| GET | `/api/v1/screening/sessions/:id` | Get session + results |
| GET | `/api/v1/screening/statistics` | Parent dashboard stats |
| GET | `/api/v1/screening/doctor/statistics` | Doctor dashboard stats |
| POST | `/api/v1/screening/sessions/:id/share` | Share a report with a doctor |
| GET | `/api/v1/screening/reports/received` | Reports shared to a doctor |
| PUT | `/api/v1/screening/reports/:shareId/review` | Add notes / mark reviewed |

### ML Service (proxied → FastAPI :8001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ml/camera-screening` | Analyze captured frames |
| POST | `/ml/live-inference` | Real-time per-frame scoring |
| POST | `/ml/report/:sessionId` | Generate PDF report |

---

## 👥 Multi-Role System

| Role | Capabilities |
|------|-------------|
| **Parent** | Add children, run camera screenings, track progress, share reports with a doctor |
| **Doctor** | Review shared reports, add clinical notes, patient list, analytics, appointments |

---

## 🔮 Future Roadmap

- [ ] Speech analysis integration
- [ ] AI-powered therapy recommendations
- [ ] Mobile application (React Native)
- [ ] Deep learning behavior models
- [ ] Telemedicine integration

---

## 🤝 Contributors

| Contributor | Role |
|-------------|------|
| **Aman Kumar** | Backend Developer & ML Engineer Contribute |
| **Aryan Kumar** | Frontend Developer & ML Engineer Contribute |

---

## 📜 License

This project is developed for **educational and research purposes**. Not intended for clinical diagnosis.

> ⚠️ **Disclaimer**: This platform provides screening support only. It does not provide medical diagnoses. Always consult a licensed healthcare professional for clinical evaluations.
