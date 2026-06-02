import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { FeatureFlagGuard } from './feature-flag.guard';

export const FEATURE_FLAG_KEY = 'feature_flag';

/**
 * Decorator to protect routes based on feature flag
 *
 * Usage:
 * ```typescript
 * @Controller('screening')
 * class ScreeningController {
 *   @Get('camera')
 *   @FeatureFlag('ML_CAMERA_ENABLED')
 *   async cameraScreening() { ... }
 * }
 * ```
 */
export const FeatureFlag = (flagName: string) => {
  return applyDecorators(
    SetMetadata(FEATURE_FLAG_KEY, flagName),
    UseGuards(FeatureFlagGuard),
  );
};

/**
 * Decorator for routes available only in development
 *
 * Usage:
 * ```typescript
 * @Get('debug')
 * @DevelopmentOnly()
 * async debugEndpoint() { ... }
 * ```
 */
export const DevelopmentOnly = () => {
  return SetMetadata('development_only', true);
};

/**
 * Decorator for routes available only in production
 *
 * Usage:
 * ```typescript
 * @Post('maintenance')
 * @ProductionOnly()
 * async maintenanceEndpoint() { ... }
 * ```
 */
export const ProductionOnly = () => {
  return SetMetadata('production_only', true);
};