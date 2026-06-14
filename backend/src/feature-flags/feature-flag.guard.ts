import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagsService } from './feature-flags.service';
import { FEATURE_FLAG_KEY } from './decorators/feature-flag.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  private readonly logger = new Logger(FeatureFlagGuard.name);

  constructor(
    private reflector: Reflector,
    private featureFlagsService: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for feature flag requirement
    const requiredFlag = this.reflector.get<string>(
      FEATURE_FLAG_KEY,
      context.getHandler(),
    );

    if (requiredFlag) {
      const isEnabled = await this.featureFlagsService.isEnabled(requiredFlag);
      if (!isEnabled) {
        this.logger.warn(
          `Feature ${requiredFlag} is disabled, blocking access`,
        );
        throw new ForbiddenException(
          `This feature (${requiredFlag}) is currently disabled`,
        );
      }
    }

    // Check for development-only requirement
    const isDevelopmentOnly = this.reflector.get<boolean>(
      'development_only',
      context.getHandler(),
    );

    if (
      isDevelopmentOnly &&
      !this.featureFlagsService.isEnvironment('development')
    ) {
      throw new ForbiddenException(
        'This endpoint is only available in development mode',
      );
    }

    // Check for production-only requirement
    const isProductionOnly = this.reflector.get<boolean>(
      'production_only',
      context.getHandler(),
    );

    if (
      isProductionOnly &&
      !this.featureFlagsService.isEnvironment('production')
    ) {
      throw new ForbiddenException(
        'This endpoint is only available in production',
      );
    }

    return true;
  }
}
