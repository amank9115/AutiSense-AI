import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { AppConfigService } from '../config/config.service';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
}

// Default feature flags
const DEFAULT_FLAGS: Record<string, boolean> = {
  ML_CAMERA_ENABLED: false,
  ML_PREDICTIONS_ENABLED: true,
  AI_CHAT_ENABLED: true,
  EMAIL_NOTIFICATIONS_ENABLED: true,
  ADVANCED_ANALYTICS_ENABLED: false,
  VIDEO_RECORDING_ENABLED: false,
  MULTI_CHILD_PROFILES_ENABLED: true,
  DOCTOR_PORTAL_ENABLED: false,
  EXPORT_REPORTS_ENABLED: true,
  REAL_TIME_PREDICTIONS_ENABLED: true,
};

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly flags = new Map<string, boolean>();
  private readonly CACHE_TTL = 60; // 1 minute

  constructor(
    private cache: CacheService,
    private config: AppConfigService,
  ) {
    // Initialize default flags
    Object.entries(DEFAULT_FLAGS).forEach(([key, value]) => {
      this.flags.set(key, value);
    });

    // Override with environment variables if present
    this.loadFromEnvironment();

    this.logger.log(`Feature flags initialized: ${this.flags.size} flags`);
  }

  /**
   * Load feature flags from environment variables
   * Format: FF_<FLAG_NAME>=true|false
   */
  private loadFromEnvironment(): void {
    for (const [flagName] of this.flags) {
      const envKey = `FF_${flagName}`;
      const envValue = process.env[envKey];

      if (envValue !== undefined) {
        const enabled = envValue === 'true';
        this.flags.set(flagName, enabled);
        this.logger.log(
          `Flag ${flagName} overridden by environment: ${enabled}`,
        );
      }
    }
  }

  /**
   * Check if a feature flag is enabled
   * Uses cache for performance
   */
  async isEnabled(flag: string): Promise<boolean> {
    const cacheKey = this.cache.buildKey('flags', flag);

    try {
      // Try cache first
      const cached = await this.cache.get<boolean>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Load from memory/environment
      let enabled = DEFAULT_FLAGS[flag] ?? false;
      const envKey = `FF_${flag}`;
      if (process.env[envKey] !== undefined) {
        enabled = process.env[envKey] === 'true';
      }

      // Cache for short duration
      await this.cache.set(cacheKey, enabled, this.CACHE_TTL);

      return enabled;
    } catch (error) {
      this.logger.warn(`Failed to check flag ${flag}, using default`, error);
      return DEFAULT_FLAGS[flag] ?? false;
    }
  }

  /**
   * Enable a feature flag (runtime)
   * Note: Only affects current instance, not persistent
   */
  enable(flag: string): void {
    this.flags.set(flag, true);
    this.logger.log(`Feature flag enabled: ${flag}`);
  }

  /**
   * Disable a feature flag (runtime)
   * Note: Only affects current instance, not persistent
   */
  disable(flag: string): void {
    this.flags.set(flag, false);
    this.logger.log(`Feature flag disabled: ${flag}`);
  }

  /**
   * Get all feature flags
   */
  getAll(): FeatureFlag[] {
    const result: FeatureFlag[] = [];

    for (const [name, enabled] of this.flags) {
      result.push({
        name,
        enabled,
        description: this.getFlagDescription(name),
      });
    }

    return result;
  }

  /**
   * Get enabled flags only
   */
  getEnabled(): FeatureFlag[] {
    return this.getAll().filter((f) => f.enabled);
  }

  /**
   * Get disabled flags only
   */
  getDisabled(): FeatureFlag[] {
    return this.getAll().filter((f) => !f.enabled);
  }

  /**
   * Check if service is running in a specific environment
   */
  isEnvironment(env: 'development' | 'production' | 'test'): boolean {
    return this.config.server.nodeEnv === env;
  }

  /**
   * Get flag description based on name
   */
  private getFlagDescription(name: string): string {
    const descriptions: Record<string, string> = {
      ML_CAMERA_ENABLED: 'Enable real-time camera-based ML analysis',
      ML_PREDICTIONS_ENABLED: 'Enable ML-based screening predictions',
      AI_CHAT_ENABLED: 'Enable AI chat assistant',
      EMAIL_NOTIFICATIONS_ENABLED: 'Enable email notifications',
      ADVANCED_ANALYTICS_ENABLED: 'Enable advanced analytics dashboard',
      VIDEO_RECORDING_ENABLED: 'Enable session video recording',
      MULTI_CHILD_PROFILES_ENABLED: 'Allow multiple child profiles per parent',
      DOCTOR_PORTAL_ENABLED: 'Enable doctor/clinician portal',
      EXPORT_REPORTS_ENABLED: 'Enable PDF/CSV report export',
      REAL_TIME_PREDICTIONS_ENABLED: 'Enable real-time prediction updates',
    };

    return descriptions[name] || 'No description available';
  }

  /**
   * Reset flag to default state from environment
   */
  reset(flag: string): void {
    const envKey = `FF_${flag}`;
    if (process.env[envKey] !== undefined) {
      this.flags.set(flag, process.env[envKey] === 'true');
    } else {
      this.flags.set(flag, DEFAULT_FLAGS[flag] ?? false);
    }
    this.logger.log(`Feature flag reset to default: ${flag}`);
  }

  /**
   * Refresh all flags from environment
   */
  refresh(): void {
    this.loadFromEnvironment();
    this.logger.log('All feature flags refreshed from environment');
  }
}
