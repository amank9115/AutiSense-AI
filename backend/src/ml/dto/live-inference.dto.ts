import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
}
