# Phase 5: API Ecosystem Implementation Plan

**Duration:** Months 7-12 (6 months)
**Status:** Ready for Implementation
**Focus:** Public API, Webhooks, GDPR Data Export, Developer Portal

---

## Executive Summary

This plan focuses exclusively on **Task 11: API Ecosystem**. Mobile app development is deferred to a future phase. The implementation creates a comprehensive, secure, and well-documented API platform supporting healthcare systems, research institutions, and third-party applications.

---

## Current State Analysis

### Already Implemented
- **API Keys Module** (`backend/src/api-keys/`)
  - Key generation with SHA-256 hashing
  - Organization-scoped keys with custom scopes
  - Key revocation and expiration
  - `ApiKeyGuard` for authentication

- **Webhooks Module** (`backend/src/webhooks/`)
  - Webhook registration per organization
  - HMAC-SHA256 signature verification
  - Event filtering per endpoint
  - Events: `screening.completed`, `report.generated`, `subscription.updated`, `member.added`, `member.removed`

- **OpenAPI Documentation** (`/api/docs`)
  - Swagger UI with Bearer auth
  - Basic endpoint documentation

### Gaps to Address
1. API versioning strategy
2. Rate limiting tiers per plan
3. Scope-based access control enforcement
4. GDPR data export (comprehensive package + real-time API)
5. Developer portal with interactive documentation
6. Webhook retry logic and delivery tracking
7. HL7 FHIR compliance layer (healthcare integrations)
8. API analytics and usage tracking

---

## Implementation Timeline

### **Month 7: API Foundation & Versioning**

#### Week 1-2: API Versioning Strategy

**Objective:** Implement semantic versioning with backward compatibility

**Tasks:**
- [ ] Create versioned route structure (`/api/v1/`, `/api/v2/`)
- [ ] Implement version header support (`Accept: application/vnd.autisense.v1+json`)
- [ ] Add version deprecation headers (`X-API-Deprecated`, `X-API-Sunset`)
- [ ] Create version migration guide documentation

**Files to Create/Modify:**
```
backend/src/
├── common/
│   └── versioning/
│       ├── version.middleware.ts
│       ├── version.guard.ts
│       └── deprecation.decorator.ts
├── api/v1/                    # Existing routes (stable)
└── api/v2/                    # Future version (experimental)
```

**Success Criteria:**
- [ ] Version header returns correct API version
- [ ] Deprecated endpoints return warning headers
- [ ] Version negotiation works for JSON content types

---

#### Week 3-4: Rate Limiting Tiers

**Objective:** Implement plan-based rate limiting

**Tasks:**
- [ ] Extend `ThrottlerModule` with dynamic limits per subscription plan
- [ ] Create rate limit middleware with Redis backend
- [ ] Add rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- [ ] Implement burst handling for premium plans

**Rate Limit Tiers:**
| Plan          | Requests/min | Burst  | ML Endpoints/min |
|---------------|--------------|--------|------------------|
| Free          | 60           | 10     | 5                |
| Starter       | 300          | 50     | 20               |
| Pro           | 1,000        | 100    | 100              |
| Enterprise    | 10,000       | 500    | 500              |

**Files to Create/Modify:**
```
backend/src/
├── rate-limits/
│   ├── rate-limit.guard.ts
│   ├── rate-limit.service.ts
│   ├── plans.config.ts
│   └── dto/
│       └── rate-limit-info.dto.ts
```

**Success Criteria:**
- [ ] Rate limits enforced per organization plan
- [ ] Rate limit headers visible in all responses
- [ ] Graceful 429 responses with retry-after header
- [ ] ML endpoints have separate rate pool

---

### **Month 8: Scope-Based Access & Security**

#### Week 5-6: Scope Enforcement

**Objective:** Implement fine-grained scope-based access control

**Scope Definitions:**
```typescript
enum ApiScope {
  // Read scopes
  'screening:read'       = 'View screening sessions and results',
  'child:read'           = 'View child profiles',
  'report:read'          = 'Download screening reports',
  'analytics:read'       = 'Access analytics dashboards',
  
  // Write scopes
  'screening:write'      = 'Create screening sessions',
  'child:write'          = 'Manage child profiles',
  
  // Healthcare scopes (requires certification)
  'fhir:read'            = 'FHIR-compliant data access',
  'fhir:write'           = 'FHIR-compliant data submission',
  
  // Research scopes
  'research:export'      = 'Anonymized data export',
  'research:batch'       = 'Batch processing access',
}
```

**Tasks:**
- [ ] Create `@RequireScope()` decorator
- [ ] Implement `ScopeGuard` for API endpoints
- [ ] Add scope validation in API key generation
- [ ] Create scope management UI for org admins

**Files to Create/Modify:**
```
backend/src/
├── api-keys/
│   ├── scopes/
│   │   ├── scopes.enum.ts
│   │   ├── scope.guard.ts
│   │   ├── require-scope.decorator.ts
│   │   └── scope-validation.service.ts
│   └── dto/
│       └── scopes.dto.ts
```

**Success Criteria:**
- [ ] Endpoints reject requests without required scope
- [ ] Scope error messages indicate required scope
- [ ] API key creation enforces scope restrictions

---

#### Week 7-8: Enhanced Webhook System

**Objective:** Add reliability, retry logic, and delivery tracking

**Tasks:**
- [ ] Implement exponential backoff retry (max 5 retries)
- [ ] Create `WebhookDelivery` model for tracking
- [ ] Add webhook signature verification endpoint
- [ ] Implement webhook testing endpoint (ping)
- [ ] Create delivery status dashboard API

**Schema Addition:**
```prisma
model WebhookDelivery {
  id            String   @id @default(uuid())
  endpointId    String
  event         String
  payload       Json
  statusCode    Int?
  deliveredAt   DateTime?
  attempts      Int      @default(0)
  lastError     String?
  createdAt     DateTime @default(now())

  endpoint      WebhookEndpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)

  @@index([endpointId])
  @@index([createdAt])
}
```

**Files to Create/Modify:**
```
backend/src/
├── webhooks/
│   ├── webhook-delivery.service.ts
│   ├── retry.handler.ts
│   └── dto/
│       ├── test-webhook.dto.ts
│       └── delivery-status.dto.ts
```

**Success Criteria:**
- [ ] Failed webhooks retry with exponential backoff
- [ ] Delivery status queryable per webhook
- [ ] Test webhook endpoint returns success/failure

---

### **Month 9: GDPR Data Export & Compliance**

#### Week 9-10: Comprehensive Data Export

**Objective:** GDPR-compliant data portability

**Export Package Structure:**
```
data-export-{userId}-{timestamp}.zip
├── manifest.json                 # Export metadata
├── profile/
│   ├── user-profile.json         # User account data
│   └── organization-membership.json
├── children/
│   ├── child-1-profile.json
│   └── child-2-profile.json
├── screenings/
│   ├── session-1/
│   │   ├── session.json
│   │   ├── analysis-data.json
│   │   └── report.pdf
│   └── session-2/
├── analytics/
│   ├── behavioral-trends.json
│   └── longitudinal-data.json
└── shared-reports/
    └── shared-reports-index.json
```

**Tasks:**
- [ ] Create `DataExportService` with async processing
- [ ] Implement archive generation with proper structure
- [ ] Add presigned download URL with 7-day expiration
- [ ] Create export request endpoint with email notification
- [ ] Implement export status tracking

**Files to Create/Modify:**
```
backend/src/
├── gdpr/
│   ├── gdpr.module.ts
│   ├── gdpr.controller.ts
│   ├── data-export.service.ts
│   ├── archive.generator.ts
│   └── dto/
│       ├── export-request.dto.ts
│       └── export-status.dto.ts
```

**Schema Addition:**
```prisma
model DataExportRequest {
  id            String        @id @default(uuid())
  userId        String
  status        ExportStatus  @default(pending)
  format        ExportFormat  @default(comprehensive)
  downloadUrl   String?
  expiresAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime      @default(now())

  @@index([userId])
  @@index([status])
}

enum ExportStatus {
  pending
  processing
  completed
  expired
  failed
}

enum ExportFormat {
  comprehensive    // Full ZIP archive
  json_only        // JSON only (real-time API)
}
```

**Success Criteria:**
- [ ] Export request creates async job
- [ ] Email sent with download link on completion
- [ ] Download link expires after 7 days
- [ ] Export contains all user data

---

#### Week 11-12: Real-Time Data Export API

**Objective:** On-demand API for third-party data portability

**Tasks:**
- [ ] Create `/api/v1/gdpr/export` endpoint (JSON format)
- [ ] Implement streaming response for large datasets
- [ ] Add anonymization option for research exports
- [ ] Create batch export endpoint for organizations
- [ ] Add export audit logging

**API Endpoints:**
```
POST   /api/v1/gdpr/export           # Request immediate export (JSON)
GET    /api/v1/gdpr/export/status    # Check export status
GET    /api/v1/gdpr/export/download  # Download completed export
POST   /api/v1/gdpr/export/anonymized # Anonymized research export
POST   /api/v1/gdpr/export/batch     # Organization batch export
```

**Success Criteria:**
- [ ] Real-time export returns data within 30 seconds
- [ ] Anonymized export removes PII
- [ ] Batch export processes multiple users
- [ ] All exports logged for audit

---

### **Month 10: Healthcare & Research Integrations**

#### Week 13-14: HL7 FHIR Compliance Layer

**Objective:** Enable EMR/EHR integrations with FHIR R4

**FHIR Resources to Support:**
- `Patient` — Child profile mapping
- `Observation` — Screening results
- `DiagnosticReport` — Clinical reports
- `Practitioner` — Doctor/clinician profiles
- `Organization` — Healthcare organization

**Tasks:**
- [ ] Create FHIR resource mappers
- [ ] Implement `/api/v1/fhir/{resource}` endpoints
- [ ] Add FHIR capability statement
- [ ] Create SMART on FHIR authorization flow
- [ ] Document FHIR implementation guide

**Files to Create/Modify:**
```
backend/src/
├── fhir/
│   ├── fhir.module.ts
│   ├── fhir.controller.ts
│   ├── capability-statement.ts
│   ├── mappers/
│   │   ├── patient.mapper.ts
│   │   ├── observation.mapper.ts
│   │   ├── diagnostic-report.mapper.ts
│   │   └── practitioner.mapper.ts
│   └── dto/
│       └── fhir-resource.dto.ts
```

**Success Criteria:**
- [ ] FHIR endpoints return valid R4 resources
- [ ] Capability statement validates against FHIR spec
- [ ] SMART on FHIR authorization flow works

---

#### Week 15-16: Research API & Batch Processing

**Objective:** Support anonymized research data access

**Tasks:**
- [ ] Create anonymization service (PII removal, k-anonymity)
- [ ] Implement batch processing endpoint
- [ ] Add dataset versioning for research reproducibility
- [ ] Create research API documentation
- [ ] Implement data use agreement tracking

**Files to Create/Modify:**
```
backend/src/
├── research/
│   ├── research.module.ts
│   ├── research.controller.ts
│   ├── anonymization.service.ts
│   ├── batch.processor.ts
│   └── dto/
│       ├── batch-request.dto.ts
│       └── anonymization-config.dto.ts
```

**Success Criteria:**
- [ ] Anonymized data passes re-identification risk test
- [ ] Batch processing handles 10,000+ records
- [ ] Research exports cite dataset version

---

### **Month 11-12: Developer Portal & Documentation**

#### Week 17-18: Interactive API Documentation

**Objective:** Self-service developer onboarding

**Developer Portal Features:**
- API key management UI
- Interactive OpenAPI playground
- Code samples in 5 languages (JS, Python, Java, Go, C#)
- Webhook testing console
- Rate limit dashboard
- Usage analytics

**Tasks:**
- [ ] Create developer portal frontend route
- [ ] Build interactive API explorer
- [ ] Generate code samples from OpenAPI spec
- [ ] Create webhook testing console
- [ ] Add usage analytics dashboard

**Files to Create/Modify:**
```
frontend/src/
├── app/
│   └── developer/
│       ├── page.tsx                    # Portal home
│       ├── api-keys/
│       │   └── page.tsx                # Key management
│       ├── docs/
│       │   └── page.tsx                # Interactive docs
│       ├── webhooks/
│       │   └── page.tsx                # Webhook console
│       └── usage/
│           └── page.tsx                # Analytics dashboard
└── components/
    └── developer/
        ├── ApiExplorer.tsx
        ├── CodeGenerator.tsx
        ├── WebhookTester.tsx
        └── UsageChart.tsx
```

**Success Criteria:**
- [ ] Developers can create/test API keys
- [ ] Interactive API calls work in browser
- [ ] Code samples copy-ready
- [ ] Webhook testing shows real responses

---

#### Week 19-20: API Analytics & Monitoring

**Objective:** Comprehensive API observability

**Tasks:**
- [ ] Create API usage metrics collection
- [ ] Implement per-endpoint latency tracking
- [ ] Add error rate monitoring
- [ ] Create Grafana dashboards for API metrics
- [ ] Set up alerts for anomalies

**Metrics to Track:**
```typescript
// Request metrics
api_requests_total{endpoint, method, status, organization_id}
api_request_duration_seconds{endpoint, method}
api_rate_limit_hits_total{organization_id}

// Webhook metrics
webhook_dispatches_total{event, status}
webhook_delivery_duration_seconds{endpoint_id}
webhook_retries_total{endpoint_id}

// Export metrics
data_exports_total{format, status}
data_export_size_bytes{format}
```

**Success Criteria:**
- [ ] Grafana dashboards show real-time API health
- [ ] Alerts trigger on error rate > 5%
- [ ] Usage data available per organization

---

#### Week 21-24: Polish & Launch

**Tasks:**
- [ ] Security penetration testing
- [ ] Load testing (10,000 req/sec)
- [ ] Documentation review and completion
- [ ] Developer onboarding guide
- [ ] API status page integration
- [ ] Production deployment with feature flags

**Launch Checklist:**
- [ ] All endpoints documented
- [ ] Rate limits tested at scale
- [ ] Webhook retry logic verified
- [ ] GDPR export tested with real data
- [ ] FHIR endpoints validated
- [ ] Developer portal accessible
- [ ] Monitoring dashboards live

---

## Resource Requirements

### Team
| Role                  | Allocation |
|-----------------------|------------|
| Backend Developer     | 2 (full-time) |
| Frontend Developer    | 1 (50%) |
| DevOps Engineer       | 1 (25%) |
| QA Engineer           | 1 (50%) |
| Technical Writer      | 1 (25%) |

### Infrastructure
- Redis cluster for rate limiting
- S3/compatible storage for export archives
- Grafana/Prometheus for monitoring
- Additional PostgreSQL storage for audit logs

---

## Risk Mitigation

| Risk                           | Mitigation                              |
|--------------------------------|-----------------------------------------|
| Breaking API changes           | Version deprecation policy (6-month sunset) |
| Rate limit bypass attempts     | Per-IP + per-key dual limiting          |
| Data export abuse              | Daily export limits per user            |
| FHIR compliance gaps           | External FHIR validation testing        |
| Webhook endpoint attacks       | Signature verification, IP allowlisting |

---

## Success Metrics

| Metric                          | Target          |
|---------------------------------|-----------------|
| API uptime                      | 99.9%           |
| Average response time (p95)     | < 100ms         |
| Rate limit accuracy             | 100%            |
| Webhook delivery success rate   | > 99%           |
| GDPR export completion time     | < 5 minutes     |
| Developer portal satisfaction   | > 4.0/5.0       |
| API documentation coverage      | 100% endpoints  |

---

## Dependencies

### Completed Phases Required
- Phase 0: Security hardening (Helmet, rate limiting foundation)
- Phase 1: Accessibility (developer portal compliance)
- Phase 3: Billing integration (plan-based rate limits)

### External Dependencies
- Redis cluster operational
- S3 bucket configured for exports
- Monitoring infrastructure deployed
- SSL certificates for API subdomains

---

## Appendix: API Endpoint Summary

### New Endpoints to Implement

```
# API Versioning
GET    /api/version                      # API version info

# GDPR Data Export
POST   /api/v1/gdpr/export               # Request export (async)
GET    /api/v1/gdpr/export/status        # Check status
GET    /api/v1/gdpr/export/download      # Download archive
POST   /api/v1/gdpr/export/immediate     # Real-time JSON export
POST   /api/v1/gdpr/export/anonymized    # Research export
POST   /api/v1/gdpr/export/batch         # Organization batch

# FHIR R4 Resources
GET    /api/v1/fhir/metadata             # Capability statement
GET    /api/v1/fhir/Patient              # List patients
GET    /api/v1/fhir/Patient/{id}         # Get patient
GET    /api/v1/fhir/Observation          # List observations
GET    /api/v1/fhir/DiagnosticReport     # List reports
POST   /api/v1/fhir/Observation          # Create observation

# Research API
POST   /api/v1/research/batch            # Batch processing
POST   /api/v1/research/anonymize        # Anonymize dataset
GET    /api/v1/research/datasets         # Available datasets

# Webhook Enhancements
POST   /api/v1/webhooks/{id}/test        # Test webhook
GET    /api/v1/webhooks/{id}/deliveries  # Delivery history
GET    /api/v1/webhooks/{id}/verify      # Signature verification

# API Analytics
GET    /api/v1/analytics/usage           # Organization usage
GET    /api/v1/analytics/endpoint-stats  # Per-endpoint stats
```

---

**Document Version:** 1.0.0  
**Last Updated:** June 21, 2026  
**Author:** Senior Fullstack Developer
