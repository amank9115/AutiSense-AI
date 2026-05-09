# Full Stack + AI Project — Folder Structure

> Senior developer standard. Every folder has one job. AI modules live alongside regular modules — not bolted on.

---

## Root Layout

```
my-ai-app/
│
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── pr-check.yml
│
├── frontend/                   # Next.js + Vercel AI SDK
├── backend/                    # NestJS + LangChain + pgvector
├── docker-compose.yml          # Runs postgres, redis, ollama locally
├── docker-compose.prod.yml
├── .gitignore
├── .editorconfig
├── package.json                # Root scripts (concurrently)
└── README.md
```

---

## Frontend — `/frontend`

```
frontend/
│
├── src/
│   │
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   │
│   │   │   ├── chat/                       # AI chat feature
│   │   │   │   ├── page.tsx                # Session list
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx            # Active chat window
│   │   │   │
│   │   │   └── documents/                  # Document upload + management
│   │   │       ├── page.tsx                # Document library
│   │   │       └── [documentId]/
│   │   │           └── page.tsx            # Single document + chat with it
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                             # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/                           # AI chat components
│   │   │   ├── ChatWindow.tsx              # useChat() from Vercel AI SDK lives here
│   │   │   ├── ChatMessage.tsx             # Renders user / assistant message bubble
│   │   │   ├── ChatInput.tsx               # Text input + send button
│   │   │   ├── ChatSessionList.tsx         # Sidebar: list of past sessions
│   │   │   ├── TypingIndicator.tsx         # Shows while AI is streaming
│   │   │   └── StreamingText.tsx           # Renders tokens as they arrive
│   │   │
│   │   ├── documents/                      # Document management components
│   │   │   ├── DocumentUploader.tsx        # Drag-drop upload → R2 presigned URL
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── IngestionStatus.tsx         # Shows "Processing..." while BullMQ runs
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── shared/
│   │       ├── UserAvatar.tsx
│   │       └── FileUploader.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChatSession.ts               # Manages active session ID, history
│   │   ├── useDocumentUpload.ts            # Upload flow: presign → upload → poll status
│   │   └── useDebounce.ts
│   │
│   ├── lib/
│   │   ├── api.ts                          # Axios instance (base URL, auth interceptors)
│   │   ├── utils.ts
│   │   └── validations.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── chatStore.ts                    # Active session, message list, streaming state
│   │   └── uiStore.ts
│   │
│   └── types/
│       ├── api.types.ts
│       ├── chat.types.ts                   # Message, ChatSession, StreamChunk
│       ├── document.types.ts               # Document, DocumentChunk, IngestionStatus
│       └── index.ts
│
├── public/
│   ├── icons/
│   └── images/
│
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
└── Dockerfile
```

---

## Backend — `/backend`

```
backend/
│
├── src/
│   │
│   ├── main.ts                             # Bootstrap — Helmet, CORS, Swagger, Sentry, pipes
│   ├── app.module.ts                       # Root module
│   ├── app.controller.ts                   # GET /health
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── ai.config.ts                    # Groq key, Ollama URL, model names, max tokens
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── types/
│   │       ├── express.d.ts
│   │       └── pagination.types.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── cache/
│   │   ├── cache.module.ts
│   │   └── cache.service.ts
│   │
│   ├── queue/
│   │   ├── queue.module.ts
│   │   └── queue.constants.ts              # EMAIL_QUEUE, INGESTION_QUEUE
│   │
│   └── modules/
│       │
│       ├── auth/                           # Auth (unchanged from full-stack)
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   │   ├── jwt.strategy.ts
│       │   │   └── local.strategy.ts
│       │   └── dto/
│       │       ├── register.dto.ts
│       │       └── login.dto.ts
│       │
│       ├── users/                          # Users (unchanged)
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   └── dto/
│       │       └── update-user.dto.ts
│       │
│       ├── files/                          # File upload → R2 (unchanged)
│       │   ├── files.module.ts
│       │   ├── files.controller.ts
│       │   ├── files.service.ts
│       │   └── r2.client.ts
│       │
│       ├── email/                          # Email via Resend (unchanged)
│       │   ├── email.module.ts
│       │   ├── email.service.ts
│       │   ├── email.processor.ts
│       │   └── templates/
│       │       └── welcome.html
│       │
│       │
│       │── ai/                             # ★ AI MODULE (new)
│       │   ├── ai.module.ts                # Imports EmbeddingModule, RagModule
│       │   ├── ai.controller.ts            # POST /ai/chat  POST /ai/chat/stream
│       │   ├── ai.service.ts               # Orchestrates LLM calls, session persistence
│       │   │
│       │   ├── rag/
│       │   │   ├── rag.service.ts          # Full RAG pipeline: embed → search → prompt → stream
│       │   │   └── prompt-templates.ts     # System prompts, few-shot examples
│       │   │
│       │   ├── embedding/
│       │   │   ├── embedding.module.ts
│       │   │   └── embedding.service.ts    # embedText(str): number[] via Ollama
│       │   │
│       │   ├── llm/
│       │   │   ├── llm.module.ts
│       │   │   └── llm.factory.ts          # Returns Groq in prod, Ollama in dev
│       │   │
│       │   └── dto/
│       │       ├── chat.dto.ts             # sessionId, message, documentId?
│       │       └── stream-chat.dto.ts
│       │
│       └── documents/                      # ★ DOCUMENT MODULE (new)
│           ├── documents.module.ts
│           ├── documents.controller.ts     # POST /documents  GET /documents  DELETE /documents/:id
│           ├── documents.service.ts        # CRUD + dispatches ingestion job
│           ├── ingestion.processor.ts      # BullMQ worker: parse→chunk→embed→pgvector
│           ├── chunk.service.ts            # Text splitting logic (size, overlap)
│           └── dto/
│               ├── create-document.dto.ts
│               └── document-response.dto.ts
│
├── prisma/
│   ├── schema.prisma                       # Includes vector extension + DocumentChunk model
│   ├── migrations/
│   │   ├── 0001_init/
│   │   │   └── migration.sql
│   │   └── 0002_add_pgvector/
│   │       └── migration.sql               # CREATE EXTENSION vector; CREATE INDEX ivfflat;
│   └── seed.ts
│
├── test/
│   ├── ai/
│   │   ├── rag.service.spec.ts
│   │   └── embedding.service.spec.ts
│   ├── documents/
│   │   └── ingestion.processor.spec.ts
│   └── app.e2e-spec.ts
│
├── .env
├── .env.example
├── .env.test
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.ts
└── Dockerfile
```

---

## GitHub Workflows — `/.github`

```
.github/
└── workflows/
    ├── deploy.yml          # install → lint → test → build → deploy to Railway
    └── pr-check.yml        # install → lint → test (no deploy)
```

---

## What Every AI File Does

### `ai.module.ts`
Imports `EmbeddingModule`, `LlmModule`, `RagModule`. Registers `AiController` and `AiService`. This is the only file that knows how the AI sub-systems connect.

### `ai.service.ts`
Handles the full conversation lifecycle: persist user message to DB → call `RagService` → persist assistant message to DB → return stream.

### `rag.service.ts`
Pure pipeline logic. Knows nothing about HTTP. Takes `(sessionId, message)` and returns an async stream. Calls embedding, pgvector, and the LLM in sequence.

### `prompt-templates.ts`
All system prompts live here — not scattered across services. Change the AI's behavior by editing one file.

### `embedding.service.ts`
Single responsibility: call Ollama's embed endpoint. Returns `number[]`. Used by both `RagService` (query embedding) and `IngestionProcessor` (chunk embedding).

### `llm.factory.ts`
Returns the right LLM client based on `NODE_ENV`. Production → ChatGroq. Development → ChatOllama. Services import the factory, not the provider directly — so swapping LLMs requires changing one file.

### `ingestion.processor.ts`
BullMQ consumer. Receives `{ documentId, fileUrl }` job. Runs the full parse → chunk → embed → store pipeline. Slow, async, isolated from the HTTP request cycle.

### `chunk.service.ts`
Splits raw text into overlapping windows. Stateless utility — tested in isolation with plain unit tests.

### `documents.service.ts`
Handles document CRUD and dispatches the ingestion job to BullMQ. Does not do any parsing or embedding itself — that's the processor's job.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `rag.service.ts`, `chat-window.tsx` |
| Components | PascalCase | `ChatWindow`, `StreamingText` |
| Hooks | camelCase with `use` | `useChatSession`, `useDocumentUpload` |
| Services | camelCase + Service | `ragService`, `embeddingService` |
| Constants | SCREAMING_SNAKE | `INGESTION_QUEUE`, `GROQ_MODEL` |
| DB tables | snake_case | `document_chunk`, `chat_session` |
| API routes | kebab-case | `/ai/chat/stream`, `/documents/:id` |
| DTO classes | PascalCase + Dto | `ChatDto`, `CreateDocumentDto` |
| Processors | PascalCase + Processor | `IngestionProcessor`, `EmailProcessor` |
| Env vars | SCREAMING_SNAKE | `GROQ_API_KEY`, `OLLAMA_BASE_URL` |

---

## What Gets Committed vs Gitignored

| Item | Committed | Reason |
|---|---|---|
| `prisma/migrations/` | YES | Whole team needs the same schema |
| `prisma/schema.prisma` | YES | Source of truth |
| `.env.example` | YES | Documents ALL vars including AI ones |
| `.env` / `.env.local` | NO | Contains real API keys |
| `node_modules/` | NO | Installed from package.json |
| `dist/` / `.next/` | NO | Built by CI |
| `ollama_data/` (Docker volume) | NO | Model weights — huge, regeneratable |
| `.github/workflows/` | YES | CI/CD is code |
| `prisma/migrations/0002_add_pgvector/` | YES | Vector index is schema |

---

## Senior Developer Rules for AI Projects

```
1.  AI logic lives in its own module — never mix RAG code into users/ or posts/.
2.  LLM client is created once in a factory — injected everywhere, never instantiated inline.
3.  Prompts are constants — not template literals scattered across services.
4.  Embeddings are reusable — one EmbeddingService, called from both ingestion and query.
5.  Ingestion is always async — never block an HTTP request waiting for chunk embedding.
6.  Every AI endpoint is rate-limited — LLM calls are your most expensive resource.
7.  Users can only access their own documents — ownerId checked in every pgvector query.
8.  LLM errors are caught and re-thrown as HTTP 502 — never expose raw Groq/Ollama errors.
9.  Model name comes from env var — never hardcoded, so you can upgrade without a deploy.
10. Dev uses Ollama, prod uses Groq — same interface, different driver, zero code changes.
11. Chunk size and overlap are config constants — tunable without touching pipeline logic.
12. Chat history is always persisted to DB before streaming — so refresh never loses context.
```
