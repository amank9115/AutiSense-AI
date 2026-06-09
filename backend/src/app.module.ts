import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { ScreeningModule } from './screening/screening.module';
import { MlModule } from './ml/ml.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { TenantModule } from './tenant/tenant.module';
import { BillingModule } from './billing/billing.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerModule } from './common/logging';
import { RedisModule } from './redis/redis.module';
import { CacheModule } from './cache/cache.module';
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsInterceptor } from './metrics/interceptors/metrics.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule, // Import first!
    LoggerModule, // Import logger module
    RedisModule, // Redis connection for caching and lockout
    CacheModule, // Cache service
    CircuitBreakerModule, // Circuit breaker for external services
    MetricsModule, // Prometheus metrics
    FeatureFlagsModule, // Feature flags system
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
      {
        name: 'auth',
        ttl: 300000, // 5 minutes
        limit: 50, // 50 login attempts per 5 minutes (dev-friendly)
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    AiModule,
    ScreeningModule,
    MlModule,
    HealthModule,
    EmailModule,
    TenantModule,
    BillingModule,
    ApiKeysModule,
    WebhooksModule,
    AuditModule,
    AdminModule,
    ...(process.env.QUEUE_ENABLED === 'true' ? [QueueModule] : []),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CorrelationIdMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
