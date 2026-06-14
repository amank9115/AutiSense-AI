import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private config: AppConfigService) {
    const env = config?.server?.nodeEnv || 'development';
    const connectionUrl =
      config?.database?.url || process.env.DATABASE_URL || '';

    // Add connection pool parameters for production
    let finalUrl = connectionUrl;
    if (!connectionUrl.includes('connection_limit')) {
      const separator = connectionUrl.includes('?') ? '&' : '?';
      finalUrl = `${connectionUrl}${separator}connection_limit=10&pool_timeout=20`;
    }

    super({
      datasources: {
        db: {
          url: finalUrl,
        },
      },
      log:
        env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  // Helper method for transactions
  async transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      return fn(tx as unknown as PrismaService);
    });
  }
}
