import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findOne(email);
    if (user && bcrypt.compareSync(pass, user.passwordHash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: User): {
    access_token: string;
    refresh_token: string;
    user: { id: string; email: string; name: string | null; role: string };
  } {
    if (!user.emailVerified) {
      throw new Error(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
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
      const decoded = this.jwtService.verify<{ email: string }>(refreshToken);
      const user = await this.usersService.findOne(decoded.email);

      if (!user) {
        throw new Error('User not found');
      }

      const payload = { email: user.email, sub: user.id, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
        refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
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
      throw new Error('Email already registered');
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
      throw new Error('Invalid or expired verification token');
    }
    if (user.emailVerified) {
      return { message: 'Email already verified', alreadyVerified: true };
    }
    if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
      throw new Error(
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
      throw new Error('Not available in production');
    }
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new Error('User not found');
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
      throw new Error('Invalid or expired password reset token');
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
