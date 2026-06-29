import { Plan } from '@prisma/client';

export interface RateLimitTier {
  requestsPerMinute: number;
  burstLimit: number;
  mlRequestsPerMinute: number;
}

export const RATE_LIMIT_TIERS: Record<Plan, RateLimitTier> = {
  free: {
    requestsPerMinute: 60,
    burstLimit: 10,
    mlRequestsPerMinute: 5,
  },
  starter: {
    requestsPerMinute: 300,
    burstLimit: 50,
    mlRequestsPerMinute: 20,
  },
  pro: {
    requestsPerMinute: 1000,
    burstLimit: 100,
    mlRequestsPerMinute: 100,
  },
  enterprise: {
    requestsPerMinute: 10000,
    burstLimit: 500,
    mlRequestsPerMinute: 500,
  },
};

export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After',
};
