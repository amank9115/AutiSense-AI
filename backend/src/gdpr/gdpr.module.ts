import { Module } from '@nestjs/common';
import { GdprController } from './gdpr.controller';
import { DataExportService } from './data-export.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GdprController],
  providers: [DataExportService],
  exports: [DataExportService],
})
export class GdprModule {}
