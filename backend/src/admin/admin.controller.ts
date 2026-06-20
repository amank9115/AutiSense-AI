import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.super_admin)
export class AdminController {
  constructor(
    private admin: AdminService,
    private audit: AuditService,
  ) {}

  @Get('organizations')
  async listOrganizations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listOrganizations(page, limit);
  }

  @Get('organizations/:orgId')
  async getOrganization(@Param('orgId') orgId: string) {
    return this.admin.getOrganization(orgId);
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
    return this.admin.globalMetrics();
  }
}
