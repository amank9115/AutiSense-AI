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
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;

    // Skip transform for health check endpoints
    if (path === '/health' || path === '/ready') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        data,
        message: 'Success',
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
