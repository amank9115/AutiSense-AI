import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

interface ReadyResponse {
  status: 'ok' | 'error';
  checks: {
    db: 'ok' | 'error';
  };
  timestamp: string;
}

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get('health')
  @HttpCode(200)
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HealthCheck()
  @HttpCode(200)
  async getReady(): Promise<ReadyResponse> {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        checks: {
          db: 'ok',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      throw new ServiceUnavailableException({
        status: 'error',
        checks: {
          db: 'error',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
