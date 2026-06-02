import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import { AccountLockedException, InvalidCredentialsException } from '../../common/exceptions';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(
    email: string,
    passwordHash: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    try {
      const user = await this.authService.validateUser(email, passwordHash);
      if (!user) {
        throw new UnauthorizedException(new InvalidCredentialsException());
      }
      return user;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof AccountLockedException) {
        throw error;
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Wrap unknown errors
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
