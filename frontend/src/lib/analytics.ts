import type { ScreeningSession } from "@/services/api/screeningApi";

/** Aggregate screening statistics returned by the backend statistics endpoint. */
export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageRiskScore: number;
  successRate: string;
}

/** A single month's bucket in the screening-volume trend chart. */
export interface MonthBucket {
  month: string;
  screenings: number;
  avgRisk: number;
}

export interface DerivedAnalytics {
  stats: DashboardStats;
  trends: MonthBucket[];
  low: number;
  moderate: number;
  elevated: number;
  total: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Risk-score thresholds (0–100) matching the backend RiskLevel bands. */
export const RISK_THRESHOLDS = { moderate: 30, elevated: 60 } as const;

/**
 * Derives the chart-ready analytics view-model from raw stats + sessions.
 *
 * Pure function — no I/O, no side effects — so it can be unit tested directly.
 */
export function deriveAnalytics(
  stats: DashboardStats,
  sessions: ScreeningSession[],
): DerivedAnalytics {
  // Bucket sessions by month for the trend chart.
  const buckets: Record<string, { count: number; riskSum: number; riskCount: number }> = {};

  sessions.forEach((s) => {
    const key = MONTHS[new Date(s.createdAt).getMonth()];
    if (!buckets[key]) buckets[key] = { count: 0, riskSum: 0, riskCount: 0 };
    buckets[key].count++;
    if (s.riskScore !== null) {
      buckets[key].riskSum += s.riskScore; // already 0–100
      buckets[key].riskCount++;
    }
  });

  const trends: MonthBucket[] = Object.entries(buckets)
    .slice(-6)
    .map(([month, v]) => ({
      month,
      screenings: v.count,
      avgRisk: v.riskCount > 0 ? Math.round(v.riskSum / v.riskCount) : 0,
    }));

  // Risk distribution.
  const low = sessions.filter(
    (s) => s.riskScore !== null && s.riskScore < RISK_THRESHOLDS.moderate,
  ).length;
  const moderate = sessions.filter(
    (s) =>
      s.riskScore !== null &&
      s.riskScore >= RISK_THRESHOLDS.moderate &&
      s.riskScore < RISK_THRESHOLDS.elevated,
  ).length;
  const elevated = sessions.filter(
    (s) => s.riskScore !== null && s.riskScore >= RISK_THRESHOLDS.elevated,
  ).length;
  const total = low + moderate + elevated;

  return { stats, trends, low, moderate, elevated, total };
}
