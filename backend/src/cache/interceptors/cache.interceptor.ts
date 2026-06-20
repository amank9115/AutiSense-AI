import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { CacheOptions, CACHE_OPTIONS_KEY } from '../decorators/cache.decorator';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<
      CacheOptions & { enabled: boolean }
    >(CACHE_OPTIONS_KEY, context.getHandler());

    if (!cacheOptions?.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub ?? 'anonymous';
    const { prefix, ttl = 300 } = cacheOptions;

    // Build cache key from prefix and userId
    const cacheKey = this.cacheService.buildKey(prefix, userId);

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached !== null) {
      return of(cached);
    }

    // Execute handler and cache result (fire-and-forget write)
    return next.handle().pipe(
      tap((result) => {
        if (result !== null && result !== undefined) {
          void this.cacheService.set(cacheKey, result, ttl);
        }
      }),
    );
  }
}
