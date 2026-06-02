import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Get,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthException } from '../common/exceptions';

interface RequestWithUser extends Request {
  user: User;
}

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
  cookies?: Record<string, string>;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @UseGuards(ThrottlerGuard, AuthGuard('local'))
  @Post('login')
  async login(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.login(req.user);
      if (result.refresh_token) {
        this.setRefreshTokenCookie(res, result.refresh_token);
      }
      return { access_token: result.access_token, user: result.user };
    } catch (error) {
      if (error instanceof AuthException) {
        throw error;
      }
      throw new AuthException(
        error instanceof Error ? error.message : 'Login failed',
      );
    }
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(token);
    if (result.refresh_token) {
      this.setRefreshTokenCookie(res, result.refresh_token);
    }
    return {
      message: result.message,
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken: string | undefined = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new AuthException('No refresh token found');
    }
    try {
      const result = await this.authService.refreshSession(refreshToken);
      if (result.refresh_token) {
        this.setRefreshTokenCookie(res, result.refresh_token);
      }
      return { access_token: result.access_token };
    } catch (error) {
      res.clearCookie('refresh_token');
      if (error instanceof AuthException) {
        throw error;
      }
      throw new AuthException('Invalid refresh token');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)?.refresh_token;
    await this.authService.logout(refreshToken);
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAllSessions(req.user.userId);
    res.clearCookie('refresh_token');
    return result;
  }

  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(resendVerificationDto.email);
  }

  // DEV ONLY: Direct email verification for development
  @Post('dev-verify-email')
  async devVerifyEmail(@Body() body: { email: string }) {
    return this.authService.devVerifyEmail(body.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
    } catch (error) {
      if (error instanceof AuthException) {
        throw error;
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }
}
