import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService } from './rate-limit.service';
import { BillingService } from '../billing/billing.service';
import { RATE_LIMIT_HEADERS } from './rate-limit.config';
import { Plan } from '@prisma/client';

export const IS_ML_ENDPOINT = 'isMlEndpoint';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private rateLimitService: RateLimitService,
    private billingService: BillingService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get organization ID from authenticated request
    const organizationId = (request as any).user?.organizationId;
    if (!organizationId) return true; // Skip if not org-scoped

    // Check if this is an ML endpoint
    const isMlEndpoint = this.reflector.getAllAndOverride<boolean>(
      IS_ML_ENDPOINT,
      [context.getHandler(), context.getClass()],
    );

    // Get plan from subscription
    let plan: Plan = 'free';
    try {
      const subscription =
        await this.billingService.getSubscription(organizationId);
      plan = subscription?.plan || 'free';
    } catch {
      // Default to free tier on error
    }

    const result = await this.rateLimitService.checkLimit(
      organizationId,
      plan,
      isMlEndpoint,
    );

    // Set rate limit headers
    response.setHeader(RATE_LIMIT_HEADERS.LIMIT, result.limit);
    response.setHeader(RATE_LIMIT_HEADERS.REMAINING, result.remaining);
    response.setHeader(
      RATE_LIMIT_HEADERS.RESET,
      Math.floor(result.resetAt / 1000),
    );

    if (!result.allowed) {
      if (result.retryAfter) {
        response.setHeader(RATE_LIMIT_HEADERS.RETRY_AFTER, result.retryAfter);
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          error: 'Too Many Requests',
          retryAfter: result.retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
