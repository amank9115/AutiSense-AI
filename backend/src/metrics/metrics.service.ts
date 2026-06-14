import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  readonly registry: Registry;

  // HTTP metrics
  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDuration: Histogram<string>;
  readonly httpRequestsInFlight: Gauge<string>;

  // Business metrics
  readonly screeningSessionsTotal: Counter<string>;
  readonly screeningPredictionsTotal: Counter<string>;
  readonly authAttemptsTotal: Counter<string>;
  readonly authAttemptsSuccess: Counter<string>;
  readonly authAttemptsFailure: Counter<string>;

  // Cache metrics
  readonly cacheHitsTotal: Counter<string>;
  readonly cacheMissesTotal: Counter<string>;

  // System metrics
  readonly activeConnections: Gauge<string>;
  readonly up: Gauge<string>;

  constructor() {
    this.registry = new Registry();

    // HTTP request counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // HTTP requests in flight
    this.httpRequestsInFlight = new Gauge({
      name: 'http_requests_in_flight',
      help: 'Number of HTTP requests currently being processed',
      registers: [this.registry],
    });

    // Screening sessions counter
    this.screeningSessionsTotal = new Counter({
      name: 'screening_sessions_total',
      help: 'Total number of screening sessions created',
      labelNames: ['status'],
      registers: [this.registry],
    });

    // Screening predictions counter
    this.screeningPredictionsTotal = new Counter({
      name: 'screening_predictions_total',
      help: 'Total number of ML predictions made',
      labelNames: ['risk_level'],
      registers: [this.registry],
    });

    // Auth attempts counters
    this.authAttemptsSuccess = new Counter({
      name: 'auth_attempts_success_total',
      help: 'Total successful authentication attempts',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.authAttemptsFailure = new Counter({
      name: 'auth_attempts_failure_total',
      help: 'Total failed authentication attempts',
      labelNames: ['type'],
      registers: [this.registry],
    });

    // Cache metrics
    this.cacheHitsTotal = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      registers: [this.registry],
    });

    this.cacheMissesTotal = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      registers: [this.registry],
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'active_database_connections',
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    // Up metric
    this.up = new Gauge({
      name: 'up',
      help: 'Service availability (1 = up, 0 = down)',
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
    this.up.set(1);
    this.logger.log('MetricsService initialized with prom-client');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HTTP Metrics
  // ─────────────────────────────────────────────────────────────────────────

  incrementHttpRequests(method: string, path: string, status: number): void {
    const normalizedPath = this.normalizePath(path);
    this.httpRequestsTotal.inc({
      method,
      path: normalizedPath,
      status: Math.floor(status / 100) * 100,
    });
  }

  observeHttpDuration(
    method: string,
    path: string,
    durationSeconds: number,
  ): void {
    const normalizedPath = this.normalizePath(path);
    this.httpRequestDuration.observe(
      { method, path: normalizedPath },
      durationSeconds,
    );
  }

  incrementHttpInFlight(): void {
    this.httpRequestsInFlight.inc();
  }

  decrementHttpInFlight(): void {
    this.httpRequestsInFlight.dec();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Business Metrics
  // ─────────────────────────────────────────────────────────────────────────

  incrementScreeningSessions(status: 'success' | 'failed'): void {
    this.screeningSessionsTotal.inc({ status });
  }

  incrementScreeningPredictions(riskLevel: string): void {
    this.screeningPredictionsTotal.inc({ risk_level: riskLevel });
  }

  incrementAuthSuccess(type: 'login' | 'register' | 'refresh'): void {
    this.authAttemptsSuccess.inc({ type });
  }

  incrementAuthFailure(type: 'login' | 'register' | 'refresh'): void {
    this.authAttemptsFailure.inc({ type });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cache Metrics
  // ─────────────────────────────────────────────────────────────────────────

  incrementCacheHit(): void {
    this.cacheHitsTotal.inc();
  }

  incrementCacheMiss(): void {
    this.cacheMissesTotal.inc();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // System Metrics
  // ─────────────────────────────────────────────────────────────────────────

  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────────────────

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  private normalizePath(path: string): string {
    return path
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        ':id',
      )
      .replace(/\/\d+/g, '/:id');
  }
}
