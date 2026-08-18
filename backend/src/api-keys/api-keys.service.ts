import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { ApiKey } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Constant-time string comparison to prevent timing attacks.
   * Returns true if strings are equal, false otherwise.
   */
  private constantTimeEquals(a: string, b: string): boolean {
    // Convert strings to buffers for timing-safe comparison
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');

    // If lengths differ, we still need to compare to maintain constant time
    // Use the longer length and pad the shorter one
    if (bufA.length !== bufB.length) {
      // Still perform a comparison to maintain constant time
      // This prevents attackers from determining length differences via timing
      const dummyBuf = Buffer.alloc(bufA.length);
      try {
        timingSafeEqual(bufA, dummyBuf);
      } catch {
        // Ignore error - we just want the timing
      }
      return false;
    }

    try {
      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  async generate(
    organizationId: string,
    name: string,
    scopes: string[],
  ): Promise<{ key: string; record: ApiKey }> {
    const rawKey = `ak_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10);

    const record = await this.prisma.apiKey.create({
      data: { organizationId, name, keyHash, keyPrefix, scopes },
    });

    return { key: rawKey, record };
  }

  async findByHash(rawKey: string) {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    // Find by prefix first for faster lookup, then verify with constant-time comparison
    const keyPrefix = rawKey.substring(0, 10);
    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix, revokedAt: null },
    });

    // Use constant-time comparison to prevent timing attacks
    for (const candidate of candidates) {
      if (this.constantTimeEquals(keyHash, candidate.keyHash)) {
        return candidate;
      }
    }

    return null;
  }

  async listForOrg(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(id: string, organizationId: string): Promise<void> {
    // Scope by organizationId so one org cannot revoke another org's key.
    await this.prisma.apiKey.updateMany({
      where: { id, organizationId },
      data: { revokedAt: new Date() },
    });
  }

  async touchLastUsed(id: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  isValid(apiKey: ApiKey): boolean {
    if (apiKey.revokedAt) return false;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return false;
    return true;
  }
}
