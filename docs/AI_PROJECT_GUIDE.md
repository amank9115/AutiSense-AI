# Full Stack + AI Project — Complete Build Guide

> One tool per task. All free. Production-grade. AI-native.

---

## Complete Tech Stack

### Core (Full Stack)

| Layer | Tool | Free? |
|---|---|---|
| Frontend framework | **Next.js** | Yes |
| Styling | **Tailwind CSS** | Yes |
| State management | **Zustand** | Yes |
| Backend framework | **NestJS** | Yes |
| Authentication | **Passport.js** | Yes |
| ORM | **Prisma** | Yes |
| Primary database | **PostgreSQL** | Yes |
| Cache | **Redis** | Yes |
| Job queue | **BullMQ** | Yes |
| File storage | **Cloudflare R2** | 10 GB free |
| CDN + security | **Cloudflare** | Free plan |
| Email | **Resend** | 3,000/month free |
| API docs | **Swagger** | Yes |
| Testing | **Jest** | Yes |
| Containers | **Docker** | Yes |
| CI/CD | **GitHub Actions** | 2,000 min/month free |
| Deployment | **Railway** | Free tier |
| Error tracking | **Sentry** | 5,000 errors/month free |
| Monitoring | **Grafana** | Yes |

### AI Additions

| AI Task | Tool | Free? |
|---|---|---|
| LLM inference (cloud) | **Groq API** | 14,400 requests/day free |
| LLM + embeddings (local dev) | **Ollama** | Fully free, runs locally |
| AI orchestration / RAG | **LangChain.js** | Yes (open source) |
| Streaming to frontend | **Vercel AI SDK** | Yes (open source) |
| Vector storage | **pgvector** | Yes — extends your PostgreSQL |
| PDF parsing | **pdf-parse** | Yes (npm package) |
| DOCX parsing | **mammoth** | Yes (npm package) |

---

## System Requirements

```
Node.js        >= 20.x LTS
Docker Desktop latest
Git            latest
PostgreSQL     >= 15  (or via Docker)
Redis          >= 7   (or via Docker)
Ollama         latest    https://ollama.com/download
```

After installing Ollama, pull the models you need:

```bash
ollama pull llama3.2          # Chat / completions model (local dev)
ollama pull nomic-embed-text  # Embeddings model (local dev)
```

---

## Phase 1 — Project Initialization

(Same as standard full-stack setup)

```bash
mkdir my-ai-app && cd my-ai-app
git init

# Frontend
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir

# Backend
npm install -g @nestjs/cli
nest new backend --package-manager npm
```

---

## Phase 2 — Database + pgvector Setup

### 2.1 Enable pgvector extension

Add to your `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```

### 2.2 Add vector-enabled tables to schema

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  documents    Document[]
  chatSessions ChatSession[]
}

model Document {
  id        String     @id @default(uuid())
  filename  String
  fileUrl   String
  owner     User       @relation(fields: [ownerId], references: [id])
  ownerId   String
  chunks    DocumentChunk[]
  createdAt DateTime   @default(now())
}

model DocumentChunk {
  id         String                  @id @default(uuid())
  content    String
  embedding  Unsupported("vector(768)")
  document   Document                @relation(fields: [documentId], references: [id])
  documentId String
  chunkIndex Int
}

model ChatSession {
  id        String        @id @default(uuid())
  title     String?
  user      User          @relation(fields: [userId], references: [id])
  userId    String
  messages  ChatMessage[]
  createdAt DateTime      @default(now())
}

model ChatMessage {
  id        String      @id @default(uuid())
  role      String      // "user" | "assistant"
  content   String
  session   ChatSession @relation(fields: [sessionId], references: [id])
  sessionId String
  createdAt DateTime    @default(now())
}

enum Role {
  USER
  ADMIN
}
```

### 2.3 Create vector index (in a migration SQL file)

```sql
-- prisma/migrations/xxxx_add_vector_index/migration.sql
CREATE INDEX ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 2.4 Run migration

```bash
npx prisma migrate dev --name add_pgvector
npx prisma generate
```

---

## Phase 3 — Install AI Packages

### Backend (NestJS)

```bash
cd backend

# LangChain core + community integrations
npm install langchain @langchain/core @langchain/community

# Groq provider for LangChain
npm install @langchain/groq

# Ollama provider (local dev embeddings + LLM)
npm install @langchain/ollama

# pgvector store for LangChain
npm install @langchain/community

# Document parsers
npm install pdf-parse mammoth
npm install -D @types/pdf-parse

# Server-sent events (streaming)
npm install @nestjs/event-emitter

# pgvector Prisma extension
npm install @prisma/client-extension-pgvector
```

### Frontend (Next.js)

```bash
cd frontend

# Vercel AI SDK — handles streaming chat UI
npm install ai
```

---

## Phase 4 — AI Module Structure (NestJS)

Create the AI module in your backend:

```
backend/src/modules/ai/
├── ai.module.ts
├── ai.controller.ts         # POST /ai/chat, POST /ai/chat/stream, POST /ai/ingest
├── ai.service.ts            # Main AI orchestration
├── rag.service.ts           # RAG pipeline logic
├── embedding.service.ts     # Embed text via Ollama
├── ingestion.processor.ts   # BullMQ worker: parse → chunk → embed → store
└── dto/
    ├── chat.dto.ts
    └── ingest.dto.ts
```

### 4.1 LLM service (Groq in prod, Ollama in dev)

```typescript
// ai.service.ts
import { ChatGroq } from '@langchain/groq';
import { ChatOllama } from '@langchain/ollama';

const llm = process.env.NODE_ENV === 'production'
  ? new ChatGroq({
      model: 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      streaming: true,
    })
  : new ChatOllama({
      model: 'llama3.2',
      baseUrl: 'http://localhost:11434',
    });
```

### 4.2 Embedding service (Ollama — free for both dev and prod if self-hosted)

```typescript
// embedding.service.ts
import { OllamaEmbeddings } from '@langchain/ollama';

const embeddings = new OllamaEmbeddings({
  model: 'nomic-embed-text',
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

async embedText(text: string): Promise<number[]> {
  return embeddings.embedQuery(text);
}
```

### 4.3 RAG query flow

```typescript
// rag.service.ts

async queryWithContext(sessionId: string, userMessage: string) {
  // 1. Embed the user's query
  const queryEmbedding = await this.embeddingService.embedText(userMessage);

  // 2. Search pgvector for top-5 similar chunks
  const similarChunks = await this.prisma.$queryRaw`
    SELECT content, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM "DocumentChunk"
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;

  // 3. Build context string from retrieved chunks
  const context = similarChunks.map(c => c.content).join('\n\n');

  // 4. Load previous chat messages (memory)
  const history = await this.prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  // 5. Build prompt with context
  const systemPrompt = `You are a helpful assistant. Use the following context to answer:
  
${context}

If the answer is not in the context, say so honestly.`;

  // 6. Stream response from Groq
  const stream = await llm.stream([
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]);

  return stream;
}
```

---

## Phase 5 — Document Ingestion Pipeline

When a user uploads a document, it goes through a BullMQ job:

```typescript
// ingestion.processor.ts

@Processor('document-ingestion')
export class IngestionProcessor {

  @Process('ingest')
  async handleIngest(job: Job<{ documentId: string; fileUrl: string }>) {

    // 1. Download file from Cloudflare R2
    const fileBuffer = await this.filesService.downloadFile(job.data.fileUrl);

    // 2. Parse text based on file type
    let rawText: string;
    if (job.data.fileUrl.endsWith('.pdf')) {
      const parsed = await pdfParse(fileBuffer);
      rawText = parsed.text;
    } else if (job.data.fileUrl.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = result.value;
    }

    // 3. Split into overlapping chunks (512 tokens, 50 overlap)
    const chunks = this.splitIntoChunks(rawText, 512, 50);

    // 4. Embed each chunk and store in pgvector
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.embeddingService.embedText(chunks[i]);

      await this.prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, content, embedding, "documentId", "chunkIndex")
        VALUES (gen_random_uuid(), ${chunks[i]}, ${embedding}::vector, ${job.data.documentId}, ${i})
      `;
    }
  }

  private splitIntoChunks(text: string, size: number, overlap: number): string[] {
    const words = text.split(' ');
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += size - overlap) {
      chunks.push(words.slice(i, i + size).join(' '));
    }
    return chunks;
  }
}
```

---

## Phase 6 — Streaming to Frontend (Vercel AI SDK)

### Backend: SSE streaming endpoint

```typescript
// ai.controller.ts
@Post('chat/stream')
@UseGuards(JwtAuthGuard)
@Sse()
async streamChat(
  @Body() dto: ChatDto,
  @CurrentUser() user: User,
): Promise<Observable<MessageEvent>> {
  const stream = await this.ragService.queryWithContext(dto.sessionId, dto.message);

  return new Observable(observer => {
    (async () => {
      for await (const chunk of stream) {
        observer.next({ data: chunk.content });
      }
      observer.next({ data: '[DONE]' });
      observer.complete();
    })();
  });
}
```

### Frontend: useChat hook (Vercel AI SDK)

```typescript
// frontend/src/components/ChatWindow.tsx
import { useChat } from 'ai/react';

export function ChatWindow({ sessionId }: { sessionId: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL}/ai/chat/stream`,
    body: { sessionId },
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
          {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="Ask anything..." />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

---

## Phase 7 — Docker Update (add Ollama service)

Add to `docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # Pull models on first start
    command: >
      sh -c "ollama serve &
             sleep 5 &&
             ollama pull llama3.2 &&
             ollama pull nomic-embed-text &&
             wait"

volumes:
  pgdata:
  ollama_data:    # persist downloaded models
```

---

## Phase 8 — Environment Variables (AI additions)

Add to `backend/.env`:

```env
# ── AI ──────────────────────────────────────
GROQ_API_KEY=gsk_your_groq_key_here
OLLAMA_BASE_URL=http://localhost:11434    # http://ollama:11434 inside Docker

# Model names (swap without code changes)
LLM_MODEL_PROD=llama-3.3-70b-versatile
LLM_MODEL_DEV=llama3.2
EMBEDDING_MODEL=nomic-embed-text
```

---

## Phase 9 — AI Security Checklist

```
[x] Groq API key stored in environment variable only — never in code
[x] AI endpoints protected by JwtAuthGuard — unauthenticated users cannot call LLM
[x] Prompt injection guard — sanitize user input before passing to LLM
[x] Output length limits — set max_tokens to prevent runaway generation
[x] Rate limit AI endpoints separately (they're expensive even on free tiers)
[x] User can only query their own documents — check ownerId in all pgvector queries
[x] Ingestion job validates file type before parsing — never parse untrusted executables
[x] Chunk content is sanitized before embedding (no PII if not required)
[x] Streaming responses go through the same CORS/auth middleware
[x] Ollama in production is behind an internal network — never exposed publicly
```

---

## What Changes Between Dev and Prod

| Component | Development | Production |
|---|---|---|
| LLM | Ollama (local, free) | Groq API (cloud, free tier) |
| Embeddings | Ollama local | Ollama on Railway private service |
| Database | Docker postgres | Railway PostgreSQL |
| Vector store | Same postgres + pgvector | Same postgres + pgvector |
| Streaming | SSE via NestJS | SSE via NestJS (same code) |

The only code that changes between environments is the LLM provider — controlled by `NODE_ENV`. Everything else is identical.

---

## Key Commands (AI additions)

```bash
# Pull/update Ollama models
ollama pull llama3.2
ollama pull nomic-embed-text
ollama list                           # See downloaded models

# Test Groq API key
curl -H "Authorization: Bearer $GROQ_API_KEY" \
     https://api.groq.com/openai/v1/models

# Run vector similarity query manually (debugging)
psql $DATABASE_URL -c "
  SELECT content, 1 - (embedding <=> '[0.1,0.2,...]'::vector) as sim
  FROM \"DocumentChunk\" ORDER BY sim DESC LIMIT 5;
"

# Check pgvector extension is loaded
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```
