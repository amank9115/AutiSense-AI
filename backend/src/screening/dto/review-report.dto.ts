import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewReportDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  markReviewed?: boolean;

  @IsBoolean()
  @IsOptional()
  reopen?: boolean;
}
