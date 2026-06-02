import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
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

  constructor(private redis: RedisService) {
    // Allow configuration via environment variables
    this.config = {
      maxFailedAttempts: parseInt(
        process.env.LOCKOUT_MAX_ATTEMPTS || String(DEFAULT_CONFIG.maxFailedAttempts),
        10,
      ),
      lockoutDurationSeconds: parseInt(
        process.env.LOCKOUT_DURATION_SECONDS || String(DEFAULT_CONFIG.lockoutDurationSeconds),
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
    const lockCount = await this.redis.get(key);

    if (lockCount) {
      const ttl = await this.redis.ttl(key);
      const remainingMinutes = Math.ceil(ttl / 60);

      throw new AccountLockedException(
        `Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
      );
    }
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(email: string): Promise<void> {
    const key = `${this.prefix}${email}`;

    // Increment the failed attempts counter
    const attempts = await this.redis.incr(key);

    // Set expiration on first failed attempt (when count becomes 1)
    if (attempts === 1) {
      await this.redis.expire(key, this.config.lockoutDurationSeconds);
    }
  }

  /**
   * Clear lockout on successful login
   */
  async clearLockout(email: string): Promise<void> {
    const key = `${this.prefix}${email}`;
    await this.redis.del(key);
  }

  /**
   * Get current failed attempt count
   */
  async getFailedAttempts(email: string): Promise<number> {
    const key = `${this.prefix}${email}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Get remaining lockout time in seconds
   */
  async getRemainingLockoutTime(email: string): Promise<number> {
    const key = `${this.prefix}${email}`;
    return this.redis.ttl(key);
  }

  /**
   * Admin: Manually unlock an account
   */
  async unlockAccount(email: string): Promise<void> {
    const key = `${this.prefix}${email}`;
    await this.redis.del(key);
  }

  getConfig(): LockoutConfig {
    return { ...this.config };
  }
}