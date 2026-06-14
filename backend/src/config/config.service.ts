import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { IConfig } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService<IConfig, true>) {}

  get database(): IConfig['database'] {
    return this.configService.get('database', { infer: true });
  }

  get server(): IConfig['server'] {
    return this.configService.get('server', { infer: true });
  }

  get auth(): Pick<
    IConfig['server'],
    'jwtSecret' | 'jwtExpiry' | 'refreshTokenExpiry'
  > {
    return {
      jwtSecret: this.server.jwtSecret,
      jwtExpiry: this.server.jwtExpiry,
      refreshTokenExpiry: this.server.refreshTokenExpiry,
    };
  }

  get mlService(): IConfig['mlService'] {
    return this.configService.get('mlService', { infer: true });
  }

  get aiEngine(): IConfig['aiEngine'] {
    return this.configService.get('aiEngine', { infer: true });
  }

  get redis(): IConfig['redis'] {
    return this.configService.get('redis', { infer: true });
  }

  get email(): IConfig['email'] {
    return this.configService.get('email', { infer: true });
  }

  get groq(): IConfig['groq'] {
    return this.configService.get('groq', { infer: true });
  }

  get ollama(): IConfig['ollama'] {
    return this.configService.get('ollama', { infer: true });
  }

  isDevelopment(): boolean {
    return this.server.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.server.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.server.nodeEnv === 'test';
  }
}
