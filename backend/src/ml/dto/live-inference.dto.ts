import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FrameDto } from './frame.dto';

export class LiveInferenceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionKey: string;

  @ApiProperty({ type: FrameDto })
  @ValidateNested()
  @Type(() => FrameDto)
  frame: FrameDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  childInfo?: Record<string, string>;
}
