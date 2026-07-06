import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Guards /metrics behind a static Bearer token (METRICS_TOKEN env var).
 * If the env var is not set the endpoint is open — set it in production.
 */
@Injectable()
export class MetricsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const token = process.env.METRICS_TOKEN;
    if (!token) return true; // unset → open (dev convenience)

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'] ?? '';
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (provided !== token) {
      throw new UnauthorizedException('Invalid metrics token');
    }
    return true;
  }
}
