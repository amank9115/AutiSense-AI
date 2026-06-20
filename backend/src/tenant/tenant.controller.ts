import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantService } from './tenant.service';
import { OrgMembershipGuard, OrgOwnerOnly } from './org-membership.guard';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import {
  ResourceConflictException,
  NotFoundException,
} from '../common/exceptions';

interface RequestWithUser {
  user: { sub: string };
}

@Controller('api/v1/organizations')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateOrganizationDto,
  ) {
    const existing = await this.tenantService.findBySlug(dto.slug);
    if (existing) {
      throw new ResourceConflictException('Organization slug is already taken');
    }
    return this.tenantService.create(req.user.sub, dto.name, dto.slug);
  }

  @Get()
  async listMine(@Request() req: RequestWithUser) {
    return this.tenantService.findByUserId(req.user.sub);
  }

  @Get(':orgId')
  @UseGuards(OrgMembershipGuard)
  async getOne(@Param('orgId') orgId: string) {
    const org = await this.tenantService.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  @Get(':orgId/members')
  @UseGuards(OrgMembershipGuard)
  async listMembers(@Param('orgId') orgId: string) {
    return this.tenantService.listMembers(orgId);
  }

  @Delete(':orgId/members/:userId')
  @UseGuards(OrgMembershipGuard)
  @OrgOwnerOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    await this.tenantService.removeMember(orgId, userId);
  }
}
