import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Organization, OrganizationMember } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(
    ownerId: string,
    name: string,
    slug: string,
  ): Promise<Organization> {
    return this.prisma.organization.create({
      data: {
        name,
        slug,
        ownerId,
        members: {
          create: { userId: ownerId, role: 'owner' },
        },
        subscription: {
          create: { plan: 'free', status: 'active' },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Organization[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map(
      (m: OrganizationMember & { organization: Organization }) =>
        m.organization,
    );
  }

  async addMember(organizationId: string, userId: string, role = 'member') {
    return this.prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      create: { organizationId, userId, role },
      update: { role },
    });
  }

  async removeMember(organizationId: string, userId: string) {
    return this.prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  async getMember(organizationId: string, userId: string) {
    return this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  async listMembers(organizationId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}
