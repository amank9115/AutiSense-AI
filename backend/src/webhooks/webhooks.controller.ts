import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgMembershipGuard } from '../tenant/org-membership.guard';
import { WebhooksService } from './webhooks.service';
import { RegisterWebhookDto } from './dto/register-webhook.dto';

@Controller('api/v1/webhooks')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class WebhooksController {
  constructor(private webhooks: WebhooksService) {}

  @Post(':orgId')
  async register(
    @Param('orgId') orgId: string,
    @Body() dto: RegisterWebhookDto,
  ) {
    return this.webhooks.register(orgId, dto.url, dto.events);
  }

  @Get(':orgId')
  async list(@Param('orgId') orgId: string) {
    return this.webhooks.list(orgId);
  }

  @Delete(':orgId/:webhookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('orgId') orgId: string,
    @Param('webhookId') webhookId: string,
  ) {
    await this.webhooks.delete(webhookId, orgId);
  }
}
