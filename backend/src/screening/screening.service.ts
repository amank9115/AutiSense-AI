import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, DEFAULT_CACHE_TTL } from '../cache/cache.service';
import {
  NotFoundException,
  InsufficientPermissionsException,
} from '../common/exceptions';
import { ScreeningStatus, RiskLevel, Role } from '@prisma/client';

export interface CreateScreeningSessionDto {
  userId: string;
  childId: string;
  metadata?: Record<string, any>;
}

export interface SaveScreeningResultDto {
  sessionId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  behaviors: Record<string, any>;
  summary?: string;
  recommendations?: string[];
}

export interface CreateAnalysisDataDto {
  sessionId: string;
  frameCount: number;
  behaviors: Record<string, any>;
  emotions?: Record<string, any>;
}

@Injectable()
export class ScreeningService {
  private readonly logger = new Logger(ScreeningService.name);
  private readonly CACHE_TTL = DEFAULT_CACHE_TTL; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  private getUserSessionsCacheKey(userId: string): string {
    return this.cache.buildKey('screening', 'sessions', userId);
  }

  private getUserStatsCacheKey(userId: string): string {
    return this.cache.buildKey('screening', 'stats', userId);
  }

  /**
   * Create a new screening session
   */
  async createSession(dto: CreateScreeningSessionDto) {
    // Verify child belongs to user
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
    });

    if (!child || child.parentId !== dto.userId) {
      throw new NotFoundException('Child not found');
    }

    const session = await this.prisma.screeningSession.create({
      data: {
        userId: dto.userId,
        childId: dto.childId,
        organizationId: child.organizationId,
        status: ScreeningStatus.pending,
        metadata: dto.metadata,
      },
      include: {
        child: true,
      },
    });

    // Invalidate user's session cache
    await this.invalidateUserCache(dto.userId);

    return session;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    userId: string,
    status: ScreeningStatus,
  ) {
    await this.verifySessionOwnership(sessionId, userId);

    return this.prisma.screeningSession.update({
      where: { id: sessionId },
      data: {
        status,
        ...(status === ScreeningStatus.completed && {
          completedAt: new Date(),
        }),
      },
    });
  }

  /**
   * Save screening result
   */
  async saveScreeningResult(
    sessionId: string,
    userId: string,
    dto: SaveScreeningResultDto,
  ) {
    // Verify session ownership
    await this.verifySessionOwnership(sessionId, userId);

    // Update session with result data
    await this.prisma.screeningSession.update({
      where: { id: sessionId },
      data: {
        riskScore: dto.riskScore,
        riskLevel: dto.riskLevel,
        summary: dto.summary,
        status: ScreeningStatus.completed,
        completedAt: new Date(),
      },
    });

    // Create screening result record
    const result = await this.prisma.screeningResult.create({
      data: {
        sessionId,
        riskScore: dto.riskScore,
        riskLevel: dto.riskLevel,
        behaviors: dto.behaviors,
        summary: dto.summary,
        recommendations: dto.recommendations,
      },
    });

    // Invalidate user's session cache
    await this.invalidateUserCache(userId);

    return result;
  }

  /**
   * Save analysis data for session
   */
  async saveAnalysisData(
    sessionId: string,
    userId: string,
    dto: CreateAnalysisDataDto,
  ) {
    await this.verifySessionOwnership(sessionId, userId);

    return this.prisma.analysisData.create({
      data: {
        sessionId,
        frameCount: dto.frameCount,
        behaviors: dto.behaviors,
        emotions: dto.emotions,
      },
    });
  }

  /**
   * Get user's screening sessions (paginated)
   * Results are cached for 5 minutes
   */
  async getUserSessions(
    userId: string,
    role: Role = Role.parent,
    page: number = 1,
    limit: number = 20,
  ) {
    // Try to get from cache (only for first page and for parents)
    if (page === 1 && role === Role.parent) {
      const cacheKey = this.getUserSessionsCacheKey(userId);
      const cached = await this.cache.get<{
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user sessions: ${userId}`);
        return cached;
      }
    }

    const skip = (page - 1) * limit;
    let where: any = { userId };

    // If user is a doctor or clinician, they should see sessions for their organization(s)
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
        where = { organizationId: { in: orgIds } };
      } else if (role !== Role.super_admin) {
        // If not a super admin and no org memberships, they see nothing or just their own
        where = { userId };
      } else {
        // Super admin sees everything
        where = {};
      }
    }

    const [sessions, total] = await Promise.all([
      this.prisma.screeningSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          child: true,
          results: true,
        },
      }),
      this.prisma.screeningSession.count({ where }),
    ]);

    const result = {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the result (only for first page and for parents)
    if (page === 1 && role === Role.parent) {
      const cacheKey = this.getUserSessionsCacheKey(userId);
      await this.cache.set(cacheKey, result, this.CACHE_TTL);
    }

    return result;
  }

  /**
   * Get child's screening history
   */
  async getChildSessions(
    userId: string,
    childId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Verify child belongs to user
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child || child.parentId !== userId) {
      throw new NotFoundException('Child not found');
    }

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.screeningSession.findMany({
        where: {
          userId,
          childId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          results: true,
          analysisData: true,
        },
      }),
      this.prisma.screeningSession.count({
        where: { userId, childId },
      }),
    ]);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single session with all data
   */
  async getSessionDetails(sessionId: string, userId: string) {
    await this.verifySessionOwnership(sessionId, userId);

    return this.prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: {
        child: true,
        results: true,
        analysisData: true,
        report: true,
      },
    });
  }

  /**
   * Delete screening session
   */
  async deleteSession(sessionId: string, userId: string) {
    await this.verifySessionOwnership(sessionId, userId);

    await this.prisma.screeningSession.delete({
      where: { id: sessionId },
    });

    // Invalidate user's session cache
    await this.invalidateUserCache(userId);
  }

  /**
   * Get statistics for user
   * Results are cached for 5 minutes
   */
  async getUserStatistics(userId: string) {
    const cacheKey = this.getUserStatsCacheKey(userId);

    // Try to get from cache
    const cached = await this.cache.get<{
      totalSessions: number;
      completedSessions: number;
      averageRiskScore: number;
      successRate: string;
      recentActivity: any[];
    }>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for user statistics: ${userId}`);
      return cached;
    }

    const [
      totalSessions,
      completedSessions,
      averageRiskScore,
      sessionsByMonth,
    ] = await Promise.all([
      this.prisma.screeningSession.count({ where: { userId } }),
      this.prisma.screeningSession.count({
        where: {
          userId,
          status: ScreeningStatus.completed,
        },
      }),
      this.prisma.screeningResult.aggregate({
        where: { session: { userId } },
        _avg: { riskScore: true },
      }),
      this.prisma.screeningSession.groupBy({
        by: ['createdAt'],
        where: { userId },
        _count: true,
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    const result = {
      totalSessions,
      completedSessions,
      averageRiskScore: averageRiskScore._avg.riskScore || 0,
      successRate:
        totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 10000) / 100
          : 0,
      recentActivity: sessionsByMonth,
    };

    // Cache the result
    await this.cache.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Invalidate user session cache
   * Call this when sessions are created, updated, or deleted
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const sessionsKey = this.getUserSessionsCacheKey(userId);
    const statsKey = this.getUserStatsCacheKey(userId);

    await Promise.all([this.cache.del(sessionsKey), this.cache.del(statsKey)]);

    this.logger.debug(`Cache invalidated for user: ${userId}`);
  }

  /**
   * Verify session ownership
   */
  private async verifySessionOwnership(sessionId: string, userId: string) {
    const session = await this.prisma.screeningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Screening session not found');
    }

    if (session.userId !== userId) {
      throw new InsufficientPermissionsException(
        'You do not have permission to access this session',
      );
    }

    return session;
  }
}
