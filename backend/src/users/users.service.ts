import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthException, NotFoundException } from '../common/exceptions';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });
  }

  async findMany(options: {
    page: number;
    limit: number;
    role?: Role;
  }): Promise<{
    data: Array<Omit<User, 'passwordHash'>>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const skip = (options.page - 1) * options.limit;
    const where: Prisma.UserWhereInput = options.role
      ? { role: options.role }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: options.limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users as Array<Omit<User, 'passwordHash'>>,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    };
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  async addChild(userId: string, data: any) {
    return this.prisma.child.create({
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        medicalNotes: data.medicalNotes,
        parentId: userId,
      },
    });
  }

  async getChildren(userId: string, role: Role = Role.parent) {
    if (
      role === Role.doctor ||
      role === Role.clinician ||
      role === Role.super_admin
    ) {
      const memberships = await this.prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
      });
      const orgIds = memberships.map((m) => m.organizationId);

      if (orgIds.length > 0) {
        return this.prisma.child.findMany({
          where: { organizationId: { in: orgIds } },
          include: {
            parent: { select: { name: true, email: true } },
            screeningSessions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { results: true },
            },
          },
        });
      }
    }

    return this.prisma.child.findMany({
      where: { parentId: userId },
      include: {
        screeningSessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { results: true },
        },
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new AuthException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
