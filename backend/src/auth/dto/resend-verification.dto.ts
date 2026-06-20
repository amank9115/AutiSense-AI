import { IsEmail, IsOptional, IsUrl } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsUrl()
  baseUrl?: string;
}
