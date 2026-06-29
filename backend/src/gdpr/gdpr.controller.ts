import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataExportService } from './data-export.service';
import { ExportRequestDto } from './dto';

@Controller('api/v1/gdpr')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(private exportService: DataExportService) {}

  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestExport(@Request() req: any, @Body() dto: ExportRequestDto) {
    const requestId = await this.exportService.requestExport(
      req.user.sub,
      dto.format ?? 'comprehensive',
    );
    return {
      message: 'Export request accepted',
      requestId,
      statusUrl: `/api/v1/gdpr/export/${requestId}`,
    };
  }

  @Get('export/:requestId')
  async getExportStatus(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    const status = await this.exportService.getExportStatus(
      requestId,
      req.user.sub,
    );
    if (!status) {
      return { error: 'Export request not found' };
    }
    return status;
  }

  @Post('export/immediate')
  async getImmediateExport(@Request() req: any) {
    return this.exportService.getImmediateExport(req.user.sub);
  }
}
