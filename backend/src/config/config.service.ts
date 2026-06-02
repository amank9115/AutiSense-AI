import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { IConfig } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService<IConfig, true>) {}

  get database() {
    return this.configService.get('database');
  }

  get server() {
    return this.configService.get('server');
  }

  get auth() {
    return {
      jwtSecret: this.server.jwtSecret,
      jwtExpiry: this.server.jwtExpiry,
      refreshTokenExpiry: this.server.refreshTokenExpiry,
    };
  }

  get mlService() {
    return this.configService.get('mlService');
  }

  get aiEngine() {
    return this.configService.get('aiEngine');
  }

  get redis() {
    return this.configService.get('redis');
  }

  get email() {
    return this.configService.get('email');
  }

  get groq() {
    return this.configService.get('groq');
  }

  get ollama() {
    return this.configService.get('ollama');
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
