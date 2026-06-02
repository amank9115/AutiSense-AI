import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('api/v1/features')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /**
   * Get all feature flags (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Get()
  getAllFeatures() {
    return {
      flags: this.featureFlagsService.getAll(),
    };
  }

  /**
   * Get enabled feature flags (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Get('enabled')
  getEnabledFeatures() {
    return {
      flags: this.featureFlagsService.getEnabled(),
    };
  }

  /**
   * Check specific feature flag
   */
  @Get(':name')
  async checkFeature(@Param('name') name: string) {
    const enabled = await this.featureFlagsService.isEnabled(name);
    return {
      name,
      enabled,
    };
  }

  /**
   * Enable a feature flag (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Post(':name/enable')
  enableFeature(@Param('name') name: string) {
    this.featureFlagsService.enable(name);
    return {
      name,
      enabled: true,
    };
  }

  /**
   * Disable a feature flag (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Post(':name/disable')
  disableFeature(@Param('name') name: string) {
    this.featureFlagsService.disable(name);
    return {
      name,
      enabled: false,
    };
  }

  /**
   * Reset feature flag to default (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Post(':name/reset')
  resetFeature(@Param('name') name: string) {
    this.featureFlagsService.reset(name);
    return {
      name,
      enabled: this.featureFlagsService.getAll().find(f => f.name === name)?.enabled ?? false,
    };
  }

  /**
   * Refresh all flags from environment (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.doctor)
  @Post('refresh')
  refreshFeatures() {
    this.featureFlagsService.refresh();
    return {
      message: 'Feature flags refreshed',
      flags: this.featureFlagsService.getAll(),
    };
  }
}