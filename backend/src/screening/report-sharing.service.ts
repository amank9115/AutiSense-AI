import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScreeningSession, ReportShare, User } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';

interface ShareReportDto {
  sessionId: string;
  doctorId: string;
  message?: string;
}

interface UpdateShareDto {
  notes?: string;
  markReviewed?: boolean;
  reopen?: boolean;
}

@Injectable()
export class ReportSharingService {
  private readonly logger = new Logger(ReportSharingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Share a screening report with a doctor
   */
  async shareReport(parentId: string, dto: ShareReportDto): Promise<ReportShare> {
    // Verify session belongs to parent's child
    const session = await this.prisma.screeningSession.findFirst({
      where: {
        id: dto.sessionId,
        user: { id: parentId },
      },
      include: {
        child: true,
        results: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Screening session not found');
    }

    // Verify doctor exists
    const doctor = await this.prisma.user.findUnique({
      where: { id: dto.doctorId, role: 'doctor' },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if already shared
    const existing = await this.prisma.reportShare.findUnique({
      where: {
        sessionId_doctorId: {
          sessionId: dto.sessionId,
          doctorId: dto.doctorId,
        },
      },
    });

    if (existing) {
      return existing; // Already shared
    }

    // Create share record
    const share = await this.prisma.reportShare.create({
      data: {
        sessionId: dto.sessionId,
        sharedById: parentId,
        doctorId: dto.doctorId,
        status: 'pending',
        doctorNotes: dto.message,
      },
      include: {
        session: {
          include: {
            child: true,
            results: true,
          },
        },
        sharedBy: true,
        doctor: true,
      },
    });

    // Notify doctor
    await this.notificationService.createNotification({
      userId: dto.doctorId,
      type: 'REPORT_SHARED',
      title: 'New Screening Report Shared',
      message: `A screening report for ${session.child.name} has been shared with you.`,
      data: { shareId: share.id, sessionId: dto.sessionId },
    });

    this.logger.log(`Report ${dto.sessionId} shared with doctor ${dto.doctorId}`);
    return share;
  }

  /**
   * Get all reports shared with a doctor
   */
  async getDoctorReports(
    doctorId: string,
    options: { status?: 'pending' | 'reviewed'; page?: number; limit?: number } = {},
  ): Promise<{ data: ReportShare[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;

    const where = { doctorId, ...(status && { status }) };

    const [data, total] = await Promise.all([
      this.prisma.reportShare.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          session: {
            include: {
              child: true,
              results: true,
            },
          },
          sharedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.reportShare.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get a single shared report
   */
  async getSharedReport(shareId: string, userId: string): Promise<ReportShare> {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: shareId },
      include: {
        session: {
          include: {
            child: true,
            results: true,
            analysisData: true,
          },
        },
        sharedBy: {
          select: { id: true, name: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Shared report not found');
    }

    // Verify access
    const isDoctor = share.doctorId === userId;
    const isParent = share.sharedById === userId;

    if (!isDoctor && !isParent) {
      throw new ForbiddenException('Access denied to this report');
    }

    return share;
  }

  /**
   * Update a shared report (doctor adds notes, marks reviewed)
   */
  async updateSharedReport(
    shareId: string,
    doctorId: string,
    dto: UpdateShareDto,
  ): Promise<ReportShare> {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Shared report not found');
    }

    if (share.doctorId !== doctorId) {
      throw new ForbiddenException('Only the assigned doctor can update this report');
    }

    const updateData: any = {};

    if (dto.notes !== undefined) {
      updateData.doctorNotes = dto.notes;
    }

    if (dto.markReviewed) {
      updateData.status = 'reviewed';
      updateData.reviewedAt = new Date();
    }

    if (dto.reopen) {
      updateData.status = 'pending';
      updateData.reviewedAt = null;
    }

    const updated = await this.prisma.reportShare.update({
      where: { id: shareId },
      data: updateData,
      include: {
        session: {
          include: {
            child: true,
            results: true,
          },
        },
      },
    });

    // Notify parent if reviewed
    if (dto.markReviewed) {
      await this.notificationService.createNotification({
        userId: share.sharedById,
        type: 'REPORT_REVIEWED',
        title: 'Report Reviewed',
        message: `Doctor has reviewed the screening report and added clinical notes.`,
        data: { shareId, sessionId: share.sessionId },
      });
    }

    return updated;
  }

  /**
   * Get sharing statistics for a doctor
   */
  async getDoctorStatistics(doctorId: string): Promise<{
    totalReports: number;
    pendingReviews: number;
    reviewedReports: number;
    totalPatients: number;
    averageRiskScore: number;
    reviewRate: number;
    riskDistribution: { low: number; moderate: number; high: number };
    monthlyTrend: { month: string; count: number; avgRisk: number }[];
  }> {
    const shares = await this.prisma.reportShare.findMany({
      where: { doctorId },
      include: {
        session: {
          include: { results: true },
        },
      },
    });

    const totalReports = shares.length;
    const pendingReviews = shares.filter((s) => s.status === 'pending').length;
    const reviewedReports = shares.filter((s) => s.status === 'reviewed').length;

    // Unique patients
    const patientIds = new Set(shares.map((s) => s.session?.childId).filter(Boolean));
    const totalPatients = patientIds.size;

    // Average risk score
    const riskScores = shares
      .map((s) => s.session?.results?.riskScore)
      .filter((r): r is number => r !== null && r !== undefined);
    const averageRiskScore =
      riskScores.length > 0
        ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
        : 0;

    // Review rate
    const reviewRate = totalReports > 0 ? reviewedReports / totalReports : 0;

    // Risk distribution
    const riskDistribution = {
      low: shares.filter((s) => s.session?.results?.riskLevel === 'low').length,
      moderate: shares.filter(
        (s) =>
          s.session?.results?.riskLevel === 'medium' ||
          s.session?.results?.riskLevel === 'high',
      ).length,
      high: shares.filter((s) => s.session?.results?.riskLevel === 'very_high').length,
    };

    // Monthly trend (last 6 months)
    const monthlyTrend = this.calculateMonthlyTrend(shares);

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

  private calculateMonthlyTrend(
    shares: any[],
  ): { month: string; count: number; avgRisk: number }[] {
    const months: Map<string, { count: number; totalRisk: number }> = new Map();

    for (const share of shares) {
      const date = new Date(share.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const current = months.get(key) || { count: 0, totalRisk: 0 };
      current.count += 1;
      if (share.session?.results?.riskScore !== null && share.session?.results?.riskScore !== undefined) {
        current.totalRisk += share.session.results.riskScore;
      }
      months.set(key, current);
    }

    return Array.from(months.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([month, data]) => ({
        month,
        count: data.count,
        avgRisk: data.count > 0 ? data.totalRisk / data.count : 0,
      }))
      .reverse();
  }
}
