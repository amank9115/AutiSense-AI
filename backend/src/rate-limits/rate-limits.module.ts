import { Module, Global } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';
import { BillingModule } from '../billing/billing.module';

@Global()
@Module({
  imports: [BillingModule],
  providers: [RateLimitService, RateLimitGuard],
  exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitsModule {}
