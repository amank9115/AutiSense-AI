import { SetMetadata } from '@nestjs/common';

export interface CacheOptions {
  /** Cache key prefix */
  prefix: string;
  /** TTL in seconds (default: 300) */
  ttl?: number;
  /** Whether to skip caching null results */
  skipNull?: boolean;
}

export const CACHE_OPTIONS_KEY = 'cache_options';

/**
 * Decorator to cache method results
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * class MyService {
 *   @Cacheable({ prefix: 'user', ttl: 300 })
 *   async getUser(id: string) {
 *     return this.prisma.user.findUnique({ where: { id } });
 *   }
 * }
 * ```
 */
export const Cacheable = (options: CacheOptions) => {
  return SetMetadata(CACHE_OPTIONS_KEY, {
    enabled: true,
    ...options,
  });
};

/**
 * Options for cache invalidation
 */
export interface CacheInvalidateOptions {
  /** Cache key prefix to invalidate */
  prefix: string;
  /** Whether to invalidate all keys matching prefix */
  all?: boolean;
  /** Function to extract the key from method arguments */
  keyExtractor?: (...args: any[]) => string | string[];
}

/**
 * Decorator to invalidate cache after method execution
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * class MyService {
 *   @CacheInvalidate({ prefix: 'user', all: true })
 *   async updateUser(id: string) {
 *     // Cache for user:id will be invalidated after this
 *     return this.prisma.user.update({ ... });
 *   }
 * }
 * ```
 */
export const CacheInvalidate = (options: CacheInvalidateOptions) => {
  return SetMetadata('cache_invalidate', options);
};