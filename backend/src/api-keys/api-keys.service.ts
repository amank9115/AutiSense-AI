import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ApiKey } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async generate(
    organizationId: string,
    name: string,
    scopes: string[],
  ): Promise<{ key: string; record: any }> {
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
    return this.prisma.apiKey.findUnique({ where: { keyHash } });
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
