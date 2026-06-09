import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEndpoint } from '@prisma/client';

export type WebhookEvent =
  | 'screening.completed'
  | 'report.generated'
  | 'subscription.updated'
  | 'member.added'
  | 'member.removed';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async register(organizationId: string, url: string, events: WebhookEvent[]) {
    const secret = randomBytes(32).toString('hex');
    return this.prisma.webhookEndpoint.create({
      data: { organizationId, url, secret, events },
    });
  }

  async list(organizationId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { organizationId },
      select: { id: true, url: true, events: true, active: true, createdAt: true },
    });
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.webhookEndpoint.deleteMany({ where: { id, organizationId } });
  }

  async dispatch(organizationId: string, event: WebhookEvent, payload: Record<string, any>): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { organizationId, active: true },
    });

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

    await Promise.allSettled(
      endpoints
        .filter((ep: WebhookEndpoint) => (ep.events as string[]).includes(event))
        .map((ep: WebhookEndpoint) => this.deliver(ep.url, ep.secret, body)),
    );
  }

  private async deliver(url: string, secret: string, body: string): Promise<void> {
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      this.logger.warn(`Webhook delivery failed for ${url}: ${(err as Error).message}`);
    }
  }
}
