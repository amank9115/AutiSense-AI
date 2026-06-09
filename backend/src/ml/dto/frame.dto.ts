import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FrameDto {
  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  eyeContact: number;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  attentionSpan: number;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  emotionSignals: number;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  gestureAnalysis: number;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  frameIndex?: number;

  @ApiPropertyOptional({ description: 'Base64-encoded frame image' })
  @IsOptional()
  @IsString()
  imageBase64?: string;
}
