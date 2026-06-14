import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface SuccessResponse<T = any> {
  data: T;
  message: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;

    // Skip transform for health check endpoints
    if (path === '/health' || path === '/ready') {
      return next.handle() as Observable<SuccessResponse<T>>;
    }

    return next.handle().pipe(
      map((data: T) => ({
        data,
        message: 'Success',
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
