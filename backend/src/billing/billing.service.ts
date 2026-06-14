import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {}

  async getSubscription(organizationId: string) {
    return this.prisma.subscription.findUnique({ where: { organizationId } });
  }

  async updatePlan(organizationId: string, plan: Plan): Promise<void> {
    await this.prisma.subscription.update({
      where: { organizationId },
      data: { plan },
    });
  }

  async updateStatus(
    organizationId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    await this.prisma.subscription.update({
      where: { organizationId },
      data: { status },
    });
  }

  handleStripeWebhook(_payload: Buffer, _signature: string): Promise<void> {
    // Stripe webhook handler — validate signature and process events.
    // Install stripe SDK: npm install stripe
    // Implement: checkout.session.completed, invoice.payment_failed, customer.subscription.updated
    this.logger.log('Stripe webhook received — Stripe SDK integration pending');
    return Promise.resolve();
  }
}
