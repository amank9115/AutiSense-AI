import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Body,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { UsageService } from './usage.service';

@Controller('api/v1/billing')
export class BillingController {
  constructor(
    private billing: BillingService,
    private usage: UsageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('subscription/:orgId')
  async getSubscription(@Param('orgId') orgId: string) {
    return this.billing.getSubscription(orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage/:orgId')
  async getUsage(@Param('orgId') orgId: string) {
    const count = await this.usage.getScreeningCountThisMonth(orgId);
    const subscription = await this.billing.getSubscription(orgId);
    const limits = this.usage.getLimitsForPlan(subscription?.plan ?? 'free');
    return { screeningsUsed: count, limits };
  }

  @Post('webhooks/stripe')
  async stripeWebhook(
    @Body() payload: Record<string, any>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.billing.handleStripeWebhook(
      Buffer.from(JSON.stringify(payload)),
      signature,
    );
    return { received: true };
  }
}
