import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.super_admin)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  @Get('organizations')
  async listOrganizations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page ?? '1', 10);
    const limitNum = parseInt(limit ?? '20', 10);
    const skip = (pageNum - 1) * limitNum;

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

  @Get('organizations/:orgId')
  async getOrganization(@Param('orgId') orgId: string) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: true,
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        _count: { select: { screeningSessions: true, apiKeys: true, webhooks: true } },
      },
    });
  }

  @Get('audit-logs/:orgId')
  async getAuditLogs(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.audit.query(orgId, {
      page: parseInt(page ?? '1', 10),
      limit: parseInt(limit ?? '50', 10),
      action,
    });
  }

  @Get('metrics')
  async globalMetrics() {
    const [users, orgs, screenings, apiKeys] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.screeningSession.count(),
      this.prisma.apiKey.count({ where: { revokedAt: null } }),
    ]);
    return { users, organizations: orgs, screeningSessions: screenings, activeApiKeys: apiKeys };
  }
}
