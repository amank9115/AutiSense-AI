import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuthException,
  ValidationException,
  ResourceConflictException,
  NotFoundException,
} from '../common/exceptions';
import { LockoutService } from './lockout.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
    private lockoutService: LockoutService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    // Check if account is locked
    await this.lockoutService.checkLockout(email);

    const user = await this.usersService.findOne(email);

    if (user && bcrypt.compareSync(pass, user.passwordHash)) {
      // Clear failed login attempts on successful authentication
      await this.lockoutService.clearLockout(email);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }

    // Record failed attempt
    await this.lockoutService.recordFailedAttempt(email);

    return null;
  }

  async login(user: User): Promise<{
    access_token: string;
    refresh_token: string;
    user: { id: string; email: string; name: string | null; role: string };
  }> {
    if (!user.emailVerified) {
      throw new AuthException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    // Create refresh token with rotation
    const refreshTokenData = await this.refreshTokenService.createToken(user.id);

    return {
      access_token,
      refresh_token: refreshTokenData.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshSession(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      // Validate, rotate the refresh token, and get userId
      const newTokenData = await this.refreshTokenService.rotateToken(refreshToken);

      const user = await this.usersService.findById(newTokenData.userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const payload = { email: user.email, sub: user.id, role: user.role };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        refresh_token: newTokenData.token,
      };
    } catch (error) {
      if (error instanceof AuthException) {
        throw error;
      }
      throw new AuthException(
        error instanceof Error ? error.message : 'Invalid refresh token',
      );
    }
  }

  async logout(refreshToken?: string): Promise<{ message: string }> {
    if (refreshToken) {
      try {
        await this.refreshTokenService.revokeToken(refreshToken);
      } catch (error) {
        // Token might already be invalid, continue with logout
        this.logger.debug('Token revocation failed or token already invalid');
      }
    }
    return { message: 'Logged out successfully' };
  }

  async logoutAllSessions(userId: string): Promise<{ message: string; sessionsRevoked: number }> {
    const count = await this.refreshTokenService.revokeAllUserTokens(userId);
    return {
      message: 'All sessions have been logged out',
      sessionsRevoked: count,
    };
  }

  async register(data: {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role?: string;
    baseUrl?: string;
  }): Promise<{
    user: { id: string; email: string; name: string; role: string };
    message: string;
    previewUrl?: string;
  }> {
    // Check if email already exists
    const existingUser = await this.usersService.findOne(data.email);
    if (existingUser) {
      throw new ResourceConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.usersService.create({
      email: data.email,
      name: data.name,
      phone: data.phone || '',
      passwordHash,
      role: (data.role as Role) || Role.parent,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      tokenExpiresAt: tokenExpiresAt,
    });

    // Send verification email
    const emailResult = await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
      data.baseUrl,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message:
        'Account created. Please check your email to verify your account.',
      previewUrl: emailResult.previewUrl,
    };
  }

  async verifyEmail(token: string): Promise<{
    message: string;
    access_token?: string;
    refresh_token?: string;
    user?: { id: string; email: string; name: string; role: string };
    alreadyVerified?: boolean;
  }> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new ValidationException('Invalid or expired verification token');
    }
    if (user.emailVerified) {
      return { message: 'Email already verified', alreadyVerified: true };
    }
    if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
      throw new ValidationException(
        'Verification token has expired. Please request a new one.',
      );
    }
    await this.usersService.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      tokenExpiresAt: null,
    });

    // Generate login token for auto-login
    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      message: 'Email verified successfully!',
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async resendVerification(email: string, baseUrl?: string) {
    const user = await this.usersService.findOne(email);
    const genericMessage =
      'If that email exists, a verification link has been sent.';

    if (!user) {
      return { message: genericMessage };
    }
    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.usersService.update(user.id, {
      emailVerificationToken: verificationToken,
      tokenExpiresAt: tokenExpiresAt,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
      baseUrl,
    );

    return { message: genericMessage };
  }

  // DEV ONLY: Direct email verification for development
  async devVerifyEmail(email: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new ValidationException('Not available in production');
    }
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersService.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      tokenExpiresAt: null,
    });
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string, baseUrl?: string) {
    const user = await this.usersService.findOne(email);
    // Generic message to prevent email enumeration
    const genericMessage =
      'If that email exists, a password reset link has been sent.';

    if (!user) {
      return { message: genericMessage };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: resetExpiresAt,
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
      baseUrl,
    );

    return { message: genericMessage };
  }

  async resetPassword(token: string, newPassword: string) {
    const users = await this.prisma.user.findMany({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (users.length === 0) {
      throw new ValidationException('Invalid or expired password reset token');
    }

    const user = users[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    });

    return { message: 'Password has been reset successfully' };
  }
}
