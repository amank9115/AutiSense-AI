import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = process.hrtime.bigint();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Track in-flight requests
    this.metricsService.incrementHttpInFlight();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(request, response, startTime);
        },
        error: () => {
          this.recordMetrics(request, response, startTime);
        },
      }),
    );
  }

  private recordMetrics(
    request: Request,
    response: Response,
    startTime: bigint,
  ): void {
    // Calculate duration in seconds
    const durationNs = Number(process.hrtime.bigint() - startTime);
    const durationSeconds = durationNs / 1e9;

    // Record metrics
    this.metricsService.incrementHttpRequests(
      request.method,
      request.path,
      response.statusCode,
    );

    this.metricsService.observeHttpDuration(
      request.method,
      request.path,
      durationSeconds,
    );

    // Decrement in-flight counter
    this.metricsService.decrementHttpInFlight();
  }
}