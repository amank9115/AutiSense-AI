import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';

@Controller('api/v1/storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  /**
   * Get a signed upload URL for a new report
   */
  @Post('upload-url')
  async getUploadUrl(
    @Request() req: AuthenticatedRequest,
    @Query('sessionId') sessionId: string,
    @Query('format') format: 'pdf' | 'csv' = 'pdf',
  ) {
    // Check if report export is enabled
    const isEnabled = await this.featureFlags.isEnabled(
      'EXPORT_REPORTS_ENABLED',
    );
    if (!isEnabled) {
      throw new ForbiddenException('Report export is currently disabled');
    }

    const userId = req.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Authenticated user required');
    }

    const key = this.storageService.generateReportKey(
      userId,
      sessionId,
      format,
    );

    const result = await this.storageService.getUploadUrl(key, {
      contentType: format === 'pdf' ? 'application/pdf' : 'text/csv',
    });

    return result;
  }

  /**
   * Get a signed download URL for an existing report
   */
  @Get('download/:key(*.)')
  async getDownloadUrl(
    @Request() req: AuthenticatedRequest,
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const userId = req.user?.sub;
    if (!userId || !key.startsWith(`reports/${userId}/`)) {
      throw new ForbiddenException('Access denied: you do not own this file');
    }

    const url = await this.storageService.getDownloadUrl(key, {
      expiresIn: expiresIn ? parseInt(String(expiresIn), 10) : 3600,
    });

    return { url, key };
  }

  /**
   * Delete a report
   */
  @Delete(':key(*.)')
  async deleteFile(
    @Request() req: AuthenticatedRequest,
    @Param('key') key: string,
  ) {
    const userId = req.user?.sub;
    if (!userId || !key.startsWith(`reports/${userId}/`)) {
      throw new ForbiddenException('Access denied: you do not own this file');
    }

    await this.storageService.delete(key);
    return { message: 'File deleted successfully' };
  }

  /**
   * List user's reports
   */
  @Get()
  async listFiles(@Request() req: AuthenticatedRequest) {
    const prefix = `reports/${req.user?.sub ?? ''}`;
    const files = await this.storageService.list(prefix);

    return {
      files: files.map((key) => ({
        key,
        url: this.storageService.getPublicUrl(key),
      })),
    };
  }

  /**
   * Get file metadata
   */
  @Get('metadata/:key(*.)')
  async getFileMetadata(@Param('key') key: string) {
    const metadata = await this.storageService.getMetadata(key);

    if (!metadata) {
      return { error: 'File not found' };
    }

    return {
      key,
      ...metadata,
    };
  }
}
