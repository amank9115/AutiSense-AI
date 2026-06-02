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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerModule } from './common/logging';
import { RedisModule } from './redis/redis.module';
import { CacheModule } from './cache/cache.module';
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [
    ConfigModule, // Import first!
    LoggerModule, // Import logger module
    RedisModule, // Redis connection for caching and lockout
    CacheModule, // Cache service
    CircuitBreakerModule, // Circuit breaker for external services
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
      {
        name: 'auth',
        ttl: 300000, // 5 minutes
        limit: 5, // 5 login attempts per 5 minutes
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
    ...(process.env.QUEUE_ENABLED === 'true' ? [QueueModule] : []),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
