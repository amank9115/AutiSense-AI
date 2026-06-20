import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { AccountLockedException } from '../common/exceptions';

export interface LockoutConfig {
  maxFailedAttempts: number;
  lockoutDurationSeconds: number;
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxFailedAttempts: 5,
  lockoutDurationSeconds: 15 * 60, // 15 minutes
};

@Injectable()
export class LockoutService {
  private readonly prefix = 'auth:lockout:';
  private readonly config: LockoutConfig;

  constructor(private cache: CacheService) {
    // Allow configuration via environment variables
    this.config = {
      maxFailedAttempts: parseInt(
        process.env.LOCKOUT_MAX_ATTEMPTS ||
          String(DEFAULT_CONFIG.maxFailedAttempts),
        10,
      ),
      lockoutDurationSeconds: parseInt(
        process.env.LOCKOUT_DURATION_SECONDS ||
          String(DEFAULT_CONFIG.lockoutDurationSeconds),
        10,
      ),
    };
  }

  /**
   * Check if an account is currently locked out
   * @throws AccountLockedException if account is locked
   */
  async checkLockout(email: string): Promise<void> {
    const key = `${this.prefix}${email}`;
    try {
      const lockCount = await this.cache.get<string>(key);

      if (lockCount) {
        const ttl = await this.cache.ttl(key);
        const remainingMinutes = Math.ceil(ttl / 60);

        throw new AccountLockedException(
          `Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
        );
      }
    } catch (error) {
      if (error instanceof AccountLockedException) {
        throw error;
      }
      // If Redis is down, we allow the check to pass to avoid blocking legitimate logins
      console.warn(
        `Lockout check skipped for ${email} due to Redis error:`,
        (error as Error).message,
      );
    }
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(email: string): Promise<void> {
    const key = `${this.prefix}${email}`;

    try {
      // Increment the failed attempts counter
      const attempts = await this.cache.incr(key);

      // Set expiration on first failed attempt (when count becomes 1)
      if (attempts === 1) {
        await this.cache.expire(key, this.config.lockoutDurationSeconds);
      }
    } catch (error) {
      console.warn(
        `Failed to record attempt for ${email} due to Redis error:`,
        (error as Error).message,
      );
    }
  }

  /**
   * Clear lockout on successful login
   */
  async clearLockout(email: string): Promise<void> {
    const key = `${this.prefix}${email}`;
    try {
      await this.cache.del(key);
    } catch (error) {
      console.warn(
        `Failed to clear lockout for ${email} due to Redis error:`,
        (error as Error).message,
      );
    }
  }

  /**
   * Get current failed attempt count
   */
  async getFailedAttempts(email: string): Promise<number> {
    const key = `${this.prefix}${email}`;
    const count = await this.cache.get<string>(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Get remaining lockout time in seconds
   */
  async getRemainingLockoutTime(email: string): Promise<number> {
    const key = `${this.prefix}${email}`;
    const ttl = await this.cache.ttl(key);
    // Redis returns -2 when key doesn't exist, -1 when key has no TTL
    // We return -1 for both cases to indicate "no lockout"
    return ttl < 0 ? -1 : ttl;
  }

  /**
   * Admin: Manually unlock an account
   */
  async unlockAccount(email: string): Promise<void> {
    const key = `${this.prefix}${email}`;
    await this.cache.del(key);
  }

  getConfig(): LockoutConfig {
    return { ...this.config };
  }
}
