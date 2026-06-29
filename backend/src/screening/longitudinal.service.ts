import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScreeningSession, BehavioralTrend } from '@prisma/client';

interface SessionMetrics {
  eyeContact: number;
  attention: number;
  emotion: number;
  gesture: number;
  riskScore: number;
}

interface TrendResult {
  periodStart: Date;
  periodEnd: Date;
  periodType: 'week' | 'month' | 'quarter';
  metrics: SessionMetrics;
  trends: {
    eyeContact?: number;
    attention?: number;
    emotion?: number;
    riskScore?: number;
  };
  sessionCount: number;
}

@Injectable()
export class LongitudinalService {
  private readonly logger = new Logger(LongitudinalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get behavioral trends for a child over time
   */
  async getChildTrends(
    childId: string,
    periodType: 'week' | 'month' | 'quarter' = 'month',
    limit = 12,
  ): Promise<BehavioralTrend[]> {
    return this.prisma.behavioralTrend.findMany({
      where: { childId, periodType },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  /**
   * Calculate and store behavioral trend for a period
   */
  async calculateTrend(
    childId: string,
    periodStart: Date,
    periodType: 'week' | 'month' | 'quarter',
  ): Promise<BehavioralTrend | null> {
    const periodEnd = this.getPeriodEnd(periodStart, periodType);

    // Get all completed sessions in the period
    const sessions = await this.prisma.screeningSession.findMany({
      where: {
        childId,
        status: 'completed',
        completedAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
      include: {
        results: true,
      },
    });

    if (sessions.length === 0) {
      return null;
    }

    // Calculate averages
    const metrics = this.calculateAverageMetrics(sessions);

    // Get previous period trend for comparison
    const previousPeriodStart = this.getPreviousPeriodStart(periodStart, periodType);
    const previousTrend = await this.prisma.behavioralTrend.findUnique({
      where: {
        childId_periodStart_periodType: {
          childId,
          periodStart: previousPeriodStart,
          periodType,
        },
      },
    });

    // Calculate trend changes
    const trends = previousTrend
      ? {
          eyeContact: metrics.eyeContact - previousTrend.avgEyeContact,
          attention: metrics.attention - previousTrend.avgAttention,
          emotion: metrics.emotion - previousTrend.avgEmotion,
          riskScore: metrics.riskScore - previousTrend.avgRiskScore,
        }
      : {};

    // Upsert trend record
    return this.prisma.behavioralTrend.upsert({
      where: {
        childId_periodStart_periodType: {
          childId,
          periodStart,
          periodType,
        },
      },
      update: {
        avgEyeContact: metrics.eyeContact,
        avgAttention: metrics.attention,
        avgEmotion: metrics.emotion,
        avgGesture: metrics.gesture,
        avgRiskScore: metrics.riskScore,
        sessionCount: sessions.length,
        eyeContactTrend: trends.eyeContact,
        attentionTrend: trends.attention,
        emotionTrend: trends.emotion,
        riskScoreTrend: trends.riskScore,
      },
      create: {
        childId,
        periodStart,
        periodEnd,
        periodType,
        avgEyeContact: metrics.eyeContact,
        avgAttention: metrics.attention,
        avgEmotion: metrics.emotion,
        avgGesture: metrics.gesture,
        avgRiskScore: metrics.riskScore,
        sessionCount: sessions.length,
        eyeContactTrend: trends.eyeContact,
        attentionTrend: trends.attention,
        emotionTrend: trends.emotion,
        riskScoreTrend: trends.riskScore,
      },
    });
  }

  /**
   * Get session history with metrics for a child
   */
  async getSessionHistory(
    childId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ sessions: ScreeningSession[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    const [sessions, total] = await Promise.all([
      this.prisma.screeningSession.findMany({
        where: { childId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          results: true,
          gazeData: true,
        },
      }),
      this.prisma.screeningSession.count({
        where: { childId, status: 'completed' },
      }),
    ]);

    return { sessions, total };
  }

  /**
   * Get progress summary comparing recent sessions
   */
  async getProgressSummary(childId: string): Promise<{
    overallTrend: 'improving' | 'stable' | 'declining';
    metrics: {
      eyeContact: { current: number; previous: number; change: number };
      attention: { current: number; previous: number; change: number };
      riskScore: { current: number; previous: number; change: number };
    };
    sessionsCompleted: number;
  }> {
    const recentSessions = await this.prisma.screeningSession.findMany({
      where: { childId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: { results: true },
    });

    if (recentSessions.length < 2) {
      return {
        overallTrend: 'stable',
        metrics: {
          eyeContact: { current: 0, previous: 0, change: 0 },
          attention: { current: 0, previous: 0, change: 0 },
          riskScore: { current: 0, previous: 0, change: 0 },
        },
        sessionsCompleted: recentSessions.length,
      };
    }

    // Split into two halves for comparison
    const midpoint = Math.floor(recentSessions.length / 2);
    const recent = recentSessions.slice(0, midpoint);
    const previous = recentSessions.slice(midpoint);

    const recentMetrics = this.calculateAverageMetrics(recent);
    const previousMetrics = this.calculateAverageMetrics(previous);

    const eyeContactChange = recentMetrics.eyeContact - previousMetrics.eyeContact;
    const attentionChange = recentMetrics.attention - previousMetrics.attention;
    const riskChange = recentMetrics.riskScore - previousMetrics.riskScore;

    // Determine overall trend (lower risk = improving)
    const improvementScore = eyeContactChange + attentionChange - riskChange;
    let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (improvementScore > 5) overallTrend = 'improving';
    else if (improvementScore < -5) overallTrend = 'declining';

    return {
      overallTrend,
      metrics: {
        eyeContact: {
          current: recentMetrics.eyeContact,
          previous: previousMetrics.eyeContact,
          change: eyeContactChange,
        },
        attention: {
          current: recentMetrics.attention,
          previous: previousMetrics.attention,
          change: attentionChange,
        },
        riskScore: {
          current: recentMetrics.riskScore,
          previous: previousMetrics.riskScore,
          change: riskChange,
        },
      },
      sessionsCompleted: recentSessions.length,
    };
  }

  private calculateAverageMetrics(sessions: ScreeningSession[]): SessionMetrics {
    let totalEye = 0,
      totalAttention = 0,
      totalEmotion = 0,
      totalGesture = 0,
      totalRisk = 0;
    let count = 0;

    for (const session of sessions) {
      const results = (session as any).results;
      if (results) {
        const behaviors = results.behaviors as Record<string, number> | null;
        if (behaviors) {
          totalEye += behaviors.eyeContact ?? behaviors.EyeContact ?? 0;
          totalAttention += behaviors.attention ?? behaviors.Attention ?? 0;
          totalEmotion += behaviors.emotion ?? behaviors.Emotion ?? 0;
          totalGesture += behaviors.gesture ?? behaviors.Gesture ?? 0;
        }
        totalRisk += results.riskScore ?? 0;
        count++;
      }
    }

    const divisor = count || 1;
    return {
      eyeContact: totalEye / divisor,
      attention: totalAttention / divisor,
      emotion: totalEmotion / divisor,
      gesture: totalGesture / divisor,
      riskScore: totalRisk / divisor,
    };
  }

  private getPeriodEnd(start: Date, type: 'week' | 'month' | 'quarter'): Date {
    const end = new Date(start);
    switch (type) {
      case 'week':
        end.setDate(end.getDate() + 7);
        break;
      case 'month':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'quarter':
        end.setMonth(end.getMonth() + 3);
        break;
    }
    return end;
  }

  private getPreviousPeriodStart(start: Date, type: 'week' | 'month' | 'quarter'): Date {
    const previous = new Date(start);
    switch (type) {
      case 'week':
        previous.setDate(previous.getDate() - 7);
        break;
      case 'month':
        previous.setMonth(previous.getMonth() - 1);
        break;
      case 'quarter':
        previous.setMonth(previous.getMonth() - 3);
        break;
    }
    return previous;
  }
}
