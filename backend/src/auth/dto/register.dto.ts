import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

// Password must contain:
// - At least 10 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character (@$!%*?&)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain at least: 10 characters, one uppercase, one lowercase, one number, and one special character (@$!%*?&)',
  })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
