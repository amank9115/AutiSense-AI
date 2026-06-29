import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Plan } from '@prisma/client';
import { RATE_LIMIT_TIERS } from './rate-limit.config';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    this.redis.on('error', (err: Error) => {
      this.logger.warn(`Rate-limit Redis error: ${err.message}`);
    });
  }

  async checkLimit(
    organizationId: string,
    plan: Plan,
    isMlEndpoint: boolean = false,
  ): Promise<RateLimitResult> {
    const tier = RATE_LIMIT_TIERS[plan];
    const limit = isMlEndpoint
      ? tier.mlRequestsPerMinute
      : tier.requestsPerMinute;
    const key = this.buildKey(organizationId, isMlEndpoint);
    const windowStart = Math.floor(Date.now() / 60000) * 60000;
    const resetAt = windowStart + 60000;

    try {
      const current = await this.increment(key, 60);
      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;

      return {
        allowed,
        limit,
        remaining,
        resetAt,
        retryAfter: allowed
          ? undefined
          : Math.ceil((resetAt - Date.now()) / 1000),
      };
    } catch (error) {
      this.logger.error('Redis rate limit check failed', error);
      // Fail open - allow request if Redis is unavailable
      return { allowed: true, limit, remaining: limit, resetAt };
    }
  }

  async getBurstStatus(
    organizationId: string,
    plan: Plan,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const tier = RATE_LIMIT_TIERS[plan];
    const key = `burst:${organizationId}`;

    try {
      const current = await this.increment(key, 10); // 10 second burst window
      return {
        allowed: current <= tier.burstLimit,
        remaining: Math.max(0, tier.burstLimit - current),
      };
    } catch {
      return { allowed: true, remaining: tier.burstLimit };
    }
  }

  private async increment(key: string, ttlSeconds: number): Promise<number> {
    const multi = this.redis.multi();
    multi.incr(key);
    if ((await this.redis.ttl(key)) === -1) {
      multi.expire(key, ttlSeconds);
    }
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  }

  private buildKey(organizationId: string, isMl: boolean): string {
    const minute = Math.floor(Date.now() / 60000);
    return `ratelimit:${isMl ? 'ml:' : ''}${organizationId}:${minute}`;
  }
}
