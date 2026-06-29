import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PopulationMetrics {
  totalScreenings: number;
  totalChildren: number;
  averageRiskScore: number;
  riskDistribution: { low: number; moderate: number; high: number };
  ageDistribution: { range: string; count: number }[];
  geographicDistribution: { region: string; count: number; avgRisk: number }[];
  monthlyTrends: { month: string; screenings: number; avgRisk: number }[];
  interventionSuccessRate: number;
}

interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  changePercent: number;
  predictions: { month: string; predictedRisk: number }[];
}

@Injectable()
export class PopulationAnalyticsService {
  private readonly logger = new Logger(PopulationAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPopulationMetrics(
    options: { startDate?: Date; endDate?: Date; region?: string } = {},
  ): Promise<PopulationMetrics> {
    const { startDate, endDate } = options;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.completedAt = {};
      if (startDate) dateFilter.completedAt.gte = startDate;
      if (endDate) dateFilter.completedAt.lte = endDate;
    }

    // Get all completed sessions with results
    const sessions = await this.prisma.screeningSession.findMany({
      where: {
        status: 'completed',
        ...dateFilter,
      },
      include: {
        results: true,
        child: {
          include: {
            parent: true,
          },
        },
      },
    });

    const totalScreenings = sessions.length;
    const uniqueChildren = new Set(sessions.map((s) => s.childId));
    const totalChildren = uniqueChildren.size;

    // Average risk score
    const riskScores = sessions
      .map((s) => s.results?.riskScore)
      .filter((r): r is number => r !== null && r !== undefined);
    const averageRiskScore =
      riskScores.length > 0
        ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
        : 0;

    // Risk distribution
    const riskDistribution = {
      low: sessions.filter((s) => s.results?.riskLevel === 'low').length,
      moderate: sessions.filter(
        (s) =>
          s.results?.riskLevel === 'medium' || s.results?.riskLevel === 'high',
      ).length,
      high: sessions.filter((s) => s.results?.riskLevel === 'very_high').length,
    };

    // Age distribution (calculated from dateOfBirth)
    const ageGroups: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.child?.dateOfBirth) {
        const age = this.calculateAgeInMonths(s.child.dateOfBirth);
        let range: string;
        if (age < 24) range = '0-2 years';
        else if (age < 48) range = '2-4 years';
        else if (age < 72) range = '4-6 years';
        else range = '6+ years';
        ageGroups[range] = (ageGroups[range] || 0) + 1;
      }
    });
    const ageDistribution = Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count,
    }));

    // Geographic distribution (by state from parent profile)
    const geoData: Record<string, { count: number; totalRisk: number }> = {};
    sessions.forEach((s) => {
      // Would need to add location data to user model
      // For now, use placeholder
      const regionName = 'Unknown';
      if (!geoData[regionName]) {
        geoData[regionName] = { count: 0, totalRisk: 0 };
      }
      geoData[regionName].count += 1;
      if (s.results?.riskScore) {
        geoData[regionName].totalRisk += s.results.riskScore;
      }
    });
    const geographicDistribution = Object.entries(geoData).map(
      ([region, data]) => ({
        region,
        count: data.count,
        avgRisk: data.count > 0 ? data.totalRisk / data.count : 0,
      }),
    );

    // Monthly trends
    const monthlyData: Record<
      string,
      { screenings: number; totalRisk: number }
    > = {};
    sessions.forEach((s) => {
      if (s.completedAt) {
        const month = s.completedAt.toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { screenings: 0, totalRisk: 0 };
        }
        monthlyData[month].screenings += 1;
        if (s.results?.riskScore) {
          monthlyData[month].totalRisk += s.results.riskScore;
        }
      }
    });
    const monthlyTrends = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        screenings: data.screenings,
        avgRisk: data.screenings > 0 ? data.totalRisk / data.screenings : 0,
      }));

    // Intervention success rate (from treatment plans)
    const treatmentPlans = await this.prisma.treatmentPlan.findMany({
      where: { status: 'completed' },
      include: { interventions: true },
    });

    let successfulInterventions = 0;
    let totalInterventions = 0;
    treatmentPlans.forEach((plan) => {
      plan.interventions.forEach((intervention) => {
        totalInterventions += 1;
        if (
          intervention.status === 'completed' &&
          (intervention.effectiveness || 0) >= 4
        ) {
          successfulInterventions += 1;
        }
      });
    });

    const interventionSuccessRate =
      totalInterventions > 0 ? successfulInterventions / totalInterventions : 0;

    return {
      totalScreenings,
      totalChildren,
      averageRiskScore,
      riskDistribution,
      ageDistribution,
      geographicDistribution,
      monthlyTrends,
      interventionSuccessRate,
    };
  }

  async getTrendAnalysis(childId: string): Promise<TrendAnalysis> {
    const sessions = await this.prisma.screeningSession.findMany({
      where: {
        childId,
        status: 'completed',
      },
      orderBy: { completedAt: 'asc' },
      include: { results: true },
    });

    if (sessions.length < 2) {
      return {
        direction: 'stable',
        changePercent: 0,
        predictions: [],
      };
    }

    // Calculate risk trend
    const recentSession = sessions[sessions.length - 1];
    const previousSession = sessions[sessions.length - 2];

    const recentRisk = recentSession.results?.riskScore || 0;
    const previousRisk = previousSession.results?.riskScore || 0;

    const changePercent =
      previousRisk > 0 ? ((recentRisk - previousRisk) / previousRisk) * 100 : 0;

    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (changePercent < -10) direction = 'improving';
    else if (changePercent > 10) direction = 'declining';

    // Simple linear prediction for next 3 months
    const predictions = this.generatePredictions(sessions);

    return {
      direction,
      changePercent,
      predictions,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async placeholder; will aggregate real geographic data
  async getHeatmapData(
    _options: { metric: 'screenings' | 'riskScore' | 'age' } = {
      metric: 'screenings',
    },
  ): Promise<{ region: string; value: number; lat?: number; lng?: number }[]> {
    // Placeholder for geographic heatmap data
    // In production, this would aggregate by actual geographic regions
    const mockRegions = [
      { region: 'Maharashtra', value: 150, lat: 19.7515, lng: 75.7139 },
      { region: 'Karnataka', value: 120, lat: 15.3173, lng: 75.7139 },
      { region: 'Tamil Nadu', value: 100, lat: 11.1271, lng: 78.6569 },
      { region: 'Delhi', value: 90, lat: 28.7041, lng: 77.1025 },
      { region: 'Gujarat', value: 80, lat: 22.2587, lng: 71.1924 },
    ];

    return mockRegions;
  }

  private calculateAgeInMonths(dateOfBirth: Date): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const months =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());
    return Math.max(0, months);
  }

  private generatePredictions(
    sessions: any[],
  ): { month: string; predictedRisk: number }[] {
    if (sessions.length < 3) return [];

    const recentRisks = sessions
      .slice(-6)
      .map((s) => s.results?.riskScore || 50)
      .filter((r) => r !== null);

    if (recentRisks.length < 3) return [];

    // Simple moving average prediction
    const avgRisk = recentRisks.reduce((a, b) => a + b, 0) / recentRisks.length;
    const trend =
      (recentRisks[recentRisks.length - 1] - recentRisks[0]) /
      recentRisks.length;

    const predictions = [];
    const now = new Date();

    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + i);
      const predictedRisk = Math.max(0, Math.min(100, avgRisk + trend * i));
      predictions.push({
        month: futureDate.toISOString().slice(0, 7),
        predictedRisk: Math.round(predictedRisk),
      });
    }

    return predictions;
  }
}
