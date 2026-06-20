import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationParams } from '../common/utils/pagination';

/**
 * Encapsulates the data-access logic for the super-admin endpoints.
 *
 * Previously these queries lived directly in AdminController; moving them here
 * keeps the controller thin (HTTP concerns only) and makes the logic unit
 * testable with a mocked PrismaService.
 */
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listOrganizations(page?: string, limit?: string) {
    const {
      page: pageNum,
      limit: limitNum,
      skip,
    } = getPaginationParams(page, limit);

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip,
        take: limitNum,
        include: { subscription: true, _count: { select: { members: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count(),
    ]);

    return { items, total, page: pageNum, limit: limitNum };
  }

  async getOrganization(orgId: string) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        _count: {
          select: { screeningSessions: true, apiKeys: true, webhooks: true },
        },
      },
    });
  }

  async globalMetrics() {
    const [users, orgs, screenings, apiKeys] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.screeningSession.count(),
      this.prisma.apiKey.count({ where: { revokedAt: null } }),
    ]);

    return {
      users,
      organizations: orgs,
      screeningSessions: screenings,
      activeApiKeys: apiKeys,
    };
  }
}
