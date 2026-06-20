import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams } from '../common/utils/pagination';

export interface AuditLogEntry {
  organizationId?: string;
  actorId?: string;
  actorType?: 'user' | 'system' | 'api_key';
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({ data: entry });
  }

  async query(
    organizationId: string,
    options: { page?: number; limit?: number; action?: string } = {},
  ) {
    const { page, limit, skip } = getPaginationParams(
      options.page,
      options.limit,
      { defaultLimit: 50, maxLimit: 200 },
    );

    const where: any = { organizationId };
    if (options.action) where.action = options.action;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
