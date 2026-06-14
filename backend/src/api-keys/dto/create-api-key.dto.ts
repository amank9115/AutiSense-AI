import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Friendly name for this API key' })
  @IsString()
  name: string;

  @ApiProperty({
    type: [String],
    description: 'Allowed scopes e.g. ["screening:read", "screening:write"]',
  })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiPropertyOptional({ description: 'ISO 8601 expiry date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
