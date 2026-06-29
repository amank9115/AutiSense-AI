import { IsEnum, IsOptional } from 'class-validator';
import { ExportFormat } from '@prisma/client';

export class ExportRequestDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = 'comprehensive';
}
