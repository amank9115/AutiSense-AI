import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { TokenRevokedException } from '../common/exceptions';

// Constants for token management
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Hash a refresh token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Create a new refresh token for a user with token rotation
   * Revokes all previous tokens in the same family (rotation)
   */
  async createToken(userId: string, previousTokenHash?: string): Promise<{
    token: string;
    expiresAt: Date;
    familyId: string;
  }> {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const familyId = previousTokenHash
      ? await this.getTokenFamilyId(previousTokenHash) || crypto.randomUUID()
      : crypto.randomUUID();

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      token,
      expiresAt: refreshToken.expiresAt,
      familyId: refreshToken.familyId,
    };
  }

  /**
   * Validate a refresh token
   */
  async validateToken(token: string): Promise<{
    userId: string;
    familyId: string;
    tokenId: string;
  }> {
    const tokenHash = this.hashToken(token);

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is revoked
    if (refreshToken.revokedAt) {
      // Token reuse detected - potential security issue
      // Revoke all tokens in this family to prevent further attacks
      await this.revokeAllFamilyTokens(refreshToken.familyId);
      throw new TokenRevokedException('Token has been revoked. All sessions have been logged out for security.');
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      throw new TokenRevokedException('Refresh token has expired. Please login again.');
    }

    return {
      userId: refreshToken.userId,
      familyId: refreshToken.familyId,
      tokenId: refreshToken.id,
    };
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return result.count;
  }

  /**
   * Revoke all tokens in a family (used when token reuse detected)
   */
  private async revokeAllFamilyTokens(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.warn(`Token family ${familyId} revoked due to token reuse`);
  }

  /**
   * Get the family ID for a token hash
   */
  private async getTokenFamilyId(tokenHash: string): Promise<string | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true },
    });

    return token?.familyId || null;
  }

  /**
   * Clean up expired tokens (can be called by a scheduled job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    return result.count;
  }

  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    const count = await this.prisma.refreshToken.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return count;
  }

  /**
   * Rotate a refresh token - invalidate old, create new
   * This implements the refresh token rotation pattern
   */
  async rotateToken(oldToken: string): Promise<{
    token: string;
    expiresAt: Date;
    userId: string;
  }> {
    // Validate the old token first
    const validation = await this.validateToken(oldToken);

    // Revoke the old token
    await this.revokeToken(oldToken);

    // Create a new token in the same family
    const tokenData = await this.createToken(validation.userId, oldToken);

    return {
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      userId: validation.userId,
    };
  }
}