import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/config.service';

// Default TTL values in seconds
export const DEFAULT_CACHE_TTL = 300; // 5 minutes
export const SHORT_CACHE_TTL = 60; // 1 minute
export const LONG_CACHE_TTL = 3600; // 1 hour

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;
  private isConnected = false;

  constructor(private config: AppConfigService) {
    const redisConfig = config?.redis || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    };

    const tls = process.env.REDIS_TLS === 'true';
    const password = process.env.REDIS_PASSWORD;

    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      ...(password ? { password } : {}),
      ...(tls
        ? {
            tls: {
              // Disable certificate verification for development
              rejectUnauthorized: false,
            },
          }
        : {}),
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Cache service connected to Redis');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.warn(`Cache service Redis error: ${err.message}`);
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.log('Cache service Redis ready');
    });

    // Attempt connection on initialization
    this.client.connect().catch((err) => {
      this.logger.warn(`Initial cache connection failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Cache service Redis connection closed');
  }

  private ensureConnection(): void {
    if (!this.isConnected) {
      throw new Error('Cache service is not connected to Redis');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Basic Operations
  // ─────────────────────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = DEFAULT_CACHE_TTL,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds === 0) {
        // Set without expiration
        await this.client.set(key, serialized);
      } else {
        await this.client.setex(key, ttlSeconds, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}`, error);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pattern-based Operations
  // ─────────────────────────────────────────────────────────────────────────

  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      const deleted = await this.client.del(...keys);
      this.logger.debug(`Deleted ${deleted} keys matching pattern: ${pattern}`);
      return deleted;
    } catch (error) {
      this.logger.error(`Cache delete pattern error for ${pattern}`, error);
      return 0;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Cache keys error for pattern ${pattern}`, error);
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Counter Operations
  // ─────────────────────────────────────────────────────────────────────────

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Cache incr error for key ${key}`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Cache decr error for key ${key}`, error);
      return 0;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Expiration Operations
  // ─────────────────────────────────────────────────────────────────────────

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Cache expire error for key ${key}`, error);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Cache ttl error for key ${key}`, error);
      return -1;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────────────────

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cache-aside Pattern Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get from cache, or execute function and cache the result
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = DEFAULT_CACHE_TTL,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Invalidate cache and return fresh data
   */
  async invalidateAndGet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number = DEFAULT_CACHE_TTL,
  ): Promise<T> {
    await this.del(key);
    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Wrapper for generating cache keys with prefix
   */
  buildKey(...parts: string[]): string {
    return parts.join(':');
  }
}
