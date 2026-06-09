import { IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveAnalysisDto {
  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  frameCount: number;

  @ApiProperty({ description: 'Detected behaviors keyed by behavior name' })
  @IsObject()
  behaviors: Record<string, any>;

  @ApiPropertyOptional({ description: 'Detected emotions timeline' })
  @IsOptional()
  @IsObject()
  emotions?: Record<string, any>;
}
