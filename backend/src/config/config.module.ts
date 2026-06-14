import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { configuration } from './configuration';
import { AppConfigService } from './config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().optional().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .optional()
          .default('development'),
        JWT_SECRET: Joi.string().required().min(32),
        JWT_EXPIRY: Joi.string().optional().default('24h'),
        REFRESH_TOKEN_EXPIRY: Joi.string().optional().default('7d'),
        PY_ML_ENABLED: Joi.string().optional().default('false'),
        PY_ML_BASE_URL: Joi.string()
          .optional()
          .default('http://127.0.0.1:8001'),
        PY_ML_TIMEOUT_MS: Joi.number().optional().default(2500),
        AI_ENGINE_ENABLED: Joi.string().optional().default('false'),
        AI_ENGINE_BASE_URL: Joi.string()
          .optional()
          .default('http://127.0.0.1:5000'),
        AI_ENGINE_TIMEOUT_MS: Joi.number().optional().default(3500),
        REDIS_HOST: Joi.string().optional().default('localhost'),
        REDIS_PORT: Joi.number().optional().default(6379),
        RESEND_API_KEY: Joi.string().optional(),
        EMAIL_FROM: Joi.string()
          .optional()
          .default('AutiSense <noreply@autisense.ai>'),
        GROQ_API_KEY: Joi.string().optional(),
        OLLAMA_BASE_URL: Joi.string()
          .optional()
          .default('http://localhost:11434'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
