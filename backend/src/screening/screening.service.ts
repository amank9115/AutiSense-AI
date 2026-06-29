import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, DEFAULT_CACHE_TTL } from '../cache/cache.service';
import { EmailService } from '../email/email.service';
import {
  NotFoundException,
  InsufficientPermissionsException,
} from '../common/exceptions';
import { ScreeningStatus, RiskLevel, Role, ReviewStatus } from '@prisma/client';

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
    private email: EmailService,
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
   * Share a screening report with a doctor
   */
  async shareReport(sessionId: string, userId: string, doctorId: string) {
    const session = await this.verifySessionOwnership(sessionId, userId);

    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (
      !doctor ||
      (doctor.role !== Role.doctor && doctor.role !== Role.clinician)
    ) {
      throw new NotFoundException('Doctor not found');
    }

    const parent = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const child = await this.prisma.child.findUnique({
      where: { id: session.childId },
      select: { name: true },
    });

    const share = await this.prisma.reportShare.upsert({
      where: { sessionId_doctorId: { sessionId, doctorId } },
      create: {
        sessionId,
        sharedById: userId,
        doctorId,
        status: ReviewStatus.pending,
      },
      update: { status: ReviewStatus.pending, reviewedAt: null },
    });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/doctor/reports/${share.id}`;
    await this.email.notifyDoctorOfReport(
      doctor.email,
      doctor.name,
      parent?.name ?? 'A parent',
      child?.name ?? 'their child',
      shareUrl,
    );

    return share;
  }

  /**
   * Get reports shared with a doctor (paginated)
   */
  async getDoctorReceivedReports(
    doctorId: string,
    page: number = 1,
    limit: number = 10,
    status?: ReviewStatus,
  ) {
    const skip = (page - 1) * limit;
    const where = { doctorId, ...(status && { status }) };

    const [shares, total] = await Promise.all([
      this.prisma.reportShare.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          session: {
            include: {
              child: true,
              results: true,
            },
          },
          sharedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.reportShare.count({ where }),
    ]);

    return {
      data: shares,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single report share with full session data (doctor only)
   */
  async getReportShareById(shareId: string, doctorId: string) {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: shareId },
      include: {
        session: {
          include: {
            child: true,
            results: true,
            analysisData: true,
            report: true,
          },
        },
        sharedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!share) throw new NotFoundException('Report share not found');
    if (share.doctorId !== doctorId) {
      throw new InsufficientPermissionsException(
        'You do not have access to this report',
      );
    }

    return share;
  }

  /**
   * Save doctor review notes and optionally mark as reviewed or reopen.
   * - markReviewed: set status=reviewed, stamp reviewedAt
   * - reopen: set status=pending, clear reviewedAt (Archive "Restore")
   */
  async reviewReport(
    shareId: string,
    doctorId: string,
    notes?: string,
    markReviewed = false,
    reopen = false,
  ) {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: shareId },
    });
    if (!share) throw new NotFoundException('Report share not found');
    if (share.doctorId !== doctorId) {
      throw new InsufficientPermissionsException(
        'You do not have access to this report',
      );
    }

    return this.prisma.reportShare.update({
      where: { id: shareId },
      data: {
        ...(notes !== undefined && { doctorNotes: notes }),
        ...(reopen
          ? { status: ReviewStatus.pending, reviewedAt: null }
          : markReviewed && {
              status: ReviewStatus.reviewed,
              reviewedAt: new Date(),
            }),
      },
    });
  }

  /**
   * Doctor dashboard statistics — aggregated over reports shared with this doctor.
   * Risk scores are stored 0–100.
   */
  async getDoctorStatistics(doctorId: string) {
    const shares = await this.prisma.reportShare.findMany({
      where: { doctorId },
      select: {
        status: true,
        createdAt: true,
        session: {
          select: {
            childId: true,
            results: { select: { riskScore: true } },
          },
        },
      },
    });

    const totalReports = shares.length;
    const pendingReviews = shares.filter(
      (s) => s.status === ReviewStatus.pending,
    ).length;
    const reviewedReports = totalReports - pendingReviews;
    const totalPatients = new Set(shares.map((s) => s.session.childId)).size;

    const riskScores = shares
      .map((s) => s.session.results?.riskScore)
      .filter((r): r is number => r !== null && r !== undefined);
    const averageRiskScore =
      riskScores.length > 0
        ? Math.round(
            (riskScores.reduce((a, b) => a + b, 0) / riskScores.length) * 100,
          ) / 100
        : 0;
    const reviewRate =
      totalReports > 0
        ? Math.round((reviewedReports / totalReports) * 10000) / 100
        : 0;

    // Risk distribution on the 0–100 scale (matches RiskLevel bands).
    const riskDistribution = { low: 0, moderate: 0, high: 0 };
    for (const r of riskScores) {
      if (r < 30) riskDistribution.low++;
      else if (r < 60) riskDistribution.moderate++;
      else riskDistribution.high++;
    }

    // Last 6 months of activity, oldest → newest.
    const MONTHS = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const now = new Date();
    const monthlyTrend: { month: string; count: number; avgRisk: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const inMonth = shares.filter((s) => {
        const c = new Date(s.createdAt);
        return (
          c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
        );
      });
      const monthRisks = inMonth
        .map((s) => s.session.results?.riskScore)
        .filter((r): r is number => r !== null && r !== undefined);
      monthlyTrend.push({
        month: MONTHS[d.getMonth()],
        count: inMonth.length,
        avgRisk:
          monthRisks.length > 0
            ? Math.round(
                monthRisks.reduce((a, b) => a + b, 0) / monthRisks.length,
              )
            : 0,
      });
    }

    return {
      totalReports,
      pendingReviews,
      reviewedReports,
      totalPatients,
      averageRiskScore,
      reviewRate,
      riskDistribution,
      monthlyTrend,
    };
  }

  /**
   * Doctor's patient list — distinct children across the reports shared with them,
   * each with their most-recently-shared session.
   */
  async getDoctorPatients(doctorId: string) {
    const shares = await this.prisma.reportShare.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          include: {
            child: true,
            results: { select: { riskScore: true, riskLevel: true } },
          },
        },
        sharedBy: { select: { id: true, name: true } },
      },
    });

    // Keep only the latest share per child (shares are already newest-first).
    const byChild = new Map<string, (typeof shares)[number]>();
    for (const s of shares) {
      if (!byChild.has(s.session.childId)) byChild.set(s.session.childId, s);
    }

    return Array.from(byChild.values()).map((s) => ({
      id: s.session.child.id,
      name: s.session.child.name,
      dateOfBirth: s.session.child.dateOfBirth,
      gender: s.session.child.gender,
      parent: { name: s.sharedBy?.name ?? null },
      latest: {
        shareId: s.id,
        status: s.status,
        riskScore: s.session.results?.riskScore ?? null,
        riskLevel: s.session.results?.riskLevel ?? null,
        createdAt: s.createdAt,
      },
    }));
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
