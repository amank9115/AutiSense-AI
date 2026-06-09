import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'Child profile ID for this screening session' })
  @IsString()
  childId: string;

  @ApiPropertyOptional({ description: 'Optional session metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
