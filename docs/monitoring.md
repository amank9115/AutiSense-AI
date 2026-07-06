# Monitoring & Observability Guide

## Architecture overview

| Layer | Tool | Status |
|-------|------|--------|
| Metrics collection | Prometheus (via `prom-client` on backend, FastAPI on ML) | Ready — `/metrics` endpoints exist |
| Metrics visualization | Grafana | Dashboard JSON at `infra/grafana/dashboard.json` |
| Error tracking | Sentry | Integration steps below |
| Log aggregation | Docker JSON logs → Loki or CloudWatch | Steps below |
| Alerting | Grafana Alerting or PagerDuty | Rules below |

---

## Grafana setup

### Prerequisites
- Grafana 10+
- Prometheus scraping both `backend:4000/metrics` and `ml-service:8001/metrics`

### Prometheus scrape config

```yaml
# prometheus.yml
scrape_configs:
  - job_name: autisense-backend
    static_configs:
      - targets: ['backend:4000']
    metrics_path: /metrics
    bearer_token: "${METRICS_TOKEN}"   # set METRICS_TOKEN in backend env

  - job_name: autisense-ml
    static_configs:
      - targets: ['ml-service:8001']
    metrics_path: /metrics
```

### Import the dashboard

1. Open Grafana → **Dashboards → Import**
2. Upload `infra/grafana/dashboard.json`
3. Select your Prometheus datasource when prompted

### Key panels

| Panel | Alert threshold |
|-------|----------------|
| 5xx error rate % | Alert if > 5% for 5 min |
| p95 request latency | Alert if > 3 s for 5 min |
| Heap used | Alert if > 900 MB |
| ML active sessions | Alert if > 150 |
| Event loop lag | Alert if > 500 ms |

---

## Sentry integration

### Backend (NestJS)

```bash
cd backend
npm install @sentry/nestjs @sentry/profiling-node --legacy-peer-deps
```

Create `backend/src/instrument.ts` (must be imported before anything else):

```ts
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
});
```

In `backend/src/main.ts`, add at the very top:
```ts
import './instrument';
```

Use `SentryGlobalFilter` instead of `HttpExceptionFilter` for unhandled exception capture:
```ts
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
app.useGlobalFilters(new SentryGlobalFilter());
```

### Frontend (Next.js)

```bash
cd frontend
npx @sentry/wizard@latest -i nextjs --legacy-peer-deps
```

The wizard creates `sentry.client.config.ts`, `sentry.server.config.ts`, and wires up `next.config.ts`.
Set `NEXT_PUBLIC_SENTRY_DSN` in your environment.

### Environment variables

Add to `.env.example` and GitHub Environments:

```
# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Log aggregation

### Option A — Grafana Loki (self-hosted, pairs with Grafana)

Add to `docker-compose.prod.yml`:

```yaml
loki:
  image: grafana/loki:2.9.4
  ports: ["3100:3100"]
  command: -config.file=/etc/loki/local-config.yaml
  networks: [autisense]

promtail:
  image: grafana/promtail:2.9.4
  volumes:
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
    - ./infra/promtail/config.yml:/etc/promtail/config.yml
  command: -config.file=/etc/promtail/config.yml
  networks: [autisense]
```

### Option B — AWS CloudWatch (managed)

Use the [CloudWatch Logs agent](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/QuickStartEC2Instance.html)
or the `awslogs` Docker log driver:

```yaml
services:
  backend:
    logging:
      driver: awslogs
      options:
        awslogs-region: ap-south-1
        awslogs-group: /autisense/backend
        awslogs-stream: "{{.ID}}"
```

---

## Alert rules (Grafana Alerting)

Create these rules under **Alerting → Alert rules** in Grafana:

| Rule | Expression | For | Severity |
|------|-----------|-----|----------|
| High 5xx rate | `100 * sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 5` | 5m | critical |
| High p95 latency | `histogram_quantile(0.95, ...) > 3` | 5m | warning |
| Heap near limit | `nodejs_heap_size_used_bytes > 900e6` | 10m | warning |
| ML service down | `up{job="autisense-ml"} == 0` | 1m | critical |
| Backend down | `up{job="autisense-backend"} == 0` | 1m | critical |

Route critical alerts to PagerDuty; warnings to Slack.
