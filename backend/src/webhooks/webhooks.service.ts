import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEndpoint } from '@prisma/client';
import { ValidationException } from '../common/exceptions';

export type WebhookEvent =
  | 'screening.completed'
  | 'report.generated'
  | 'subscription.updated'
  | 'member.added'
  | 'member.removed';

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // Exponential backoff

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * SSRF protection (security audit H1). Returns true if an IP address falls in
   * a private, loopback, link-local, CGNAT, or otherwise non-routable range
   * that a webhook must never be allowed to reach (internal services, cloud
   * metadata at 169.254.169.254, Redis/DB on loopback, etc.).
   */
  private isBlockedIp(ip: string): boolean {
    const v = ip.startsWith('::ffff:') ? ip.slice(7) : ip; // unwrap IPv4-mapped IPv6
    if (isIP(v) === 4) {
      const [a, b] = v.split('.').map(Number);
      if (a === 0 || a === 10 || a === 127) return true; // this-network, private, loopback
      if (a === 169 && b === 254) return true; // link-local + cloud metadata
      if (a === 172 && b >= 16 && b <= 31) return true; // private
      if (a === 192 && b === 168) return true; // private
      if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT (RFC 6598)
      if (a >= 224) return true; // multicast / reserved
      return false;
    }
    const lower = v.toLowerCase();
    if (lower === '::1' || lower === '::') return true; // loopback / unspecified
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('fe80')) return true; // link-local
    return false;
  }

  /**
   * Validate a webhook target URL against the SSRF policy. Throws
   * ValidationException on an unsafe URL. Enforced at registration time and
   * re-checked at delivery time to defend against DNS rebinding.
   */
  private async assertSafeWebhookUrl(rawUrl: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new ValidationException('Invalid webhook URL');
    }

    if (parsed.protocol !== 'https:') {
      throw new ValidationException('Webhook URL must use https');
    }

    const host = parsed.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
    if (host === 'localhost' || host.endsWith('.localhost')) {
      throw new ValidationException('Webhook URL must not target localhost');
    }

    if (isIP(host)) {
      if (this.isBlockedIp(host)) {
        throw new ValidationException(
          'Webhook URL must not target a private, loopback, or link-local address',
        );
      }
      return;
    }

    let addresses: { address: string }[];
    try {
      addresses = await lookup(host, { all: true });
    } catch {
      throw new ValidationException('Webhook host could not be resolved');
    }
    if (
      addresses.length === 0 ||
      addresses.some((a) => this.isBlockedIp(a.address))
    ) {
      throw new ValidationException(
        'Webhook URL resolves to a private, loopback, or link-local address',
      );
    }
  }

  async register(organizationId: string, url: string, events: WebhookEvent[]) {
    await this.assertSafeWebhookUrl(url);
    const secret = randomBytes(32).toString('hex');
    return this.prisma.webhookEndpoint.create({
      data: { organizationId, url, secret, events },
    });
  }

  async list(organizationId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { organizationId },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.webhookEndpoint.deleteMany({
      where: { id, organizationId },
    });
  }

  async test(
    id: string,
    organizationId: string,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, organizationId },
    });
    if (!endpoint) return { success: false, error: 'Endpoint not found' };

    const payload = {
      event: 'test',
      data: { message: 'Test webhook' },
      timestamp: new Date().toISOString(),
    };
    const body = JSON.stringify(payload);
    const result = await this.deliverWithRetry(endpoint, body, 0);
    return result;
  }

  async getDeliveries(
    endpointId: string,
    organizationId: string,
    limit: number = 50,
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, organizationId },
    });
    if (!endpoint) return [];

    return this.prisma.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async dispatch(
    organizationId: string,
    event: WebhookEvent,
    payload: Record<string, any>,
  ): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { organizationId, active: true },
    });

    const body = JSON.stringify({
      event,
      data: payload,
      timestamp: new Date().toISOString(),
    });

    await Promise.allSettled(
      endpoints
        .filter((ep: WebhookEndpoint) =>
          (ep.events as string[]).includes(event),
        )
        .map((ep: WebhookEndpoint) => this.deliverWithRetry(ep, body, 0)),
    );
  }

  private async deliverWithRetry(
    endpoint: WebhookEndpoint,
    body: string,
    attempt: number,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        event: JSON.parse(body).event,
        payload: JSON.parse(body),
        attempts: attempt + 1,
      },
    });

    const result = await this.deliver(endpoint.url, endpoint.secret, body);

    if (result.success) {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { statusCode: result.statusCode, deliveredAt: new Date() },
      });
      return result;
    }

    // Retry logic
    if (attempt < MAX_RETRIES - 1) {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { lastError: result.error, attempts: attempt + 1 },
      });

      // Schedule retry (in production, use BullMQ or similar)
      setTimeout(() => {
        this.deliverWithRetry(endpoint, body, attempt + 1).catch((err) => {
          this.logger.error(
            `Retry ${attempt + 1} failed for ${endpoint.url}`,
            err,
          );
        });
      }, RETRY_DELAYS[attempt]);

      return {
        success: false,
        error: `Retry scheduled (attempt ${attempt + 2}/${MAX_RETRIES})`,
      };
    }

    // Max retries reached
    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: { lastError: result.error },
    });

    return { success: false, error: `Max retries reached: ${result.error}` };
  }

  private async deliver(
    url: string,
    secret: string,
    body: string,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    try {
      // Re-validate at send time to defend against DNS rebinding (the host may
      // resolve to a public IP at registration but a private one now).
      await this.assertSafeWebhookUrl(url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
        },
        body,
        // Never follow redirects — a 30x to an internal URL would bypass the
        // SSRF checks above.
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`,
        };
      }

      return { success: true, statusCode: response.status };
    } catch (err) {
      this.logger.warn(
        `Webhook delivery failed for ${url}: ${(err as Error).message}`,
      );
      return { success: false, error: (err as Error).message };
    }
  }
}
