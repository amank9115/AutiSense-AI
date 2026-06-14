import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

const PLAN_LIMITS: Record<Plan, { screenings: number; apiCalls: number }> = {
  free: { screenings: 10, apiCalls: 1_000 },
  starter: { screenings: 100, apiCalls: 10_000 },
  pro: { screenings: 1_000, apiCalls: 100_000 },
  enterprise: { screenings: -1, apiCalls: -1 }, // -1 = unlimited
};

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async getScreeningCountThisMonth(organizationId: string): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return this.prisma.screeningSession.count({
      where: { organizationId, createdAt: { gte: start } },
    });
  }

  async canCreateScreening(organizationId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });
    const plan: Plan = subscription?.plan ?? 'free';
    const limit = PLAN_LIMITS[plan].screenings;
    if (limit === -1) return true;
    const used = await this.getScreeningCountThisMonth(organizationId);
    return used < limit;
  }

  getLimitsForPlan(plan: Plan) {
    return PLAN_LIMITS[plan];
  }
}
