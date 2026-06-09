import {
  IsNumber,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskLevel } from '@prisma/client';

export class SaveResultDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore: number;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Detected behaviors map' })
  @IsObject()
  behaviors: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];
}
