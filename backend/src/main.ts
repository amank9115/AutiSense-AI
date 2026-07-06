import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppConfigService } from './config/config.service';
import { LoggerService } from './common/logging';
import { HttpLoggerMiddleware } from './common/logging/http-logger.middleware';
import {
  CorrelationIdMiddleware,
  CORRELATION_ID_HEADER,
} from './common/middleware/correlation-id.middleware';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);
  const logger = app.get(LoggerService);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // 'unsafe-inline' removed in production to block XSS script injection.
          // In dev it stays for NestJS error pages and HMR tooling.
          scriptSrc:
            process.env.NODE_ENV === 'production'
              ? ["'self'"]
              : ["'self'", "'unsafe-inline'"],
          // 'unsafe-inline' retained for styles: CSS-in-JS (Tailwind JIT) cannot
          // easily use nonces. Track removal in: https://github.com/nicehash/nonce-csp
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Get allowed origins from environment
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,http://localhost:4000'
  )
    .split(',')
    .map((origin) => origin.trim());

  // CORS configuration - environment-based
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      CORRELATION_ID_HEADER,
      'Accept',
    ],
  });

  app.use(cookieParser());

  // Apply correlation ID middleware (before other middlewares)
  const correlationMiddleware = new CorrelationIdMiddleware();
  app.use(correlationMiddleware.use.bind(correlationMiddleware));

  // Apply HTTP logger middleware
  const httpLoggerMiddleware = new HttpLoggerMiddleware(logger);
  app.use(httpLoggerMiddleware.use.bind(httpLoggerMiddleware));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger is only available in non-production environments.
  if (configService.server.nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AutiSense AI - Autism Screening Platform API')
      .setDescription(
        'Comprehensive REST API for autism spectrum disorder screening with AI-powered analysis',
      )
      .setVersion('1.0.0')
      .addServer('http://localhost:4000', 'Development')
      .addServer('https://api.autisense.ai', 'Production')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access_token',
      )
      .addTag('Auth', 'Authentication and authorization endpoints')
      .addTag('Users', 'User profile and account management')
      .addTag('Screening', 'Autism screening session management')
      .addTag('Health', 'Health check and status endpoints')
      .addTag('ML', 'Machine learning inference endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
      },
    });
  }

  const port = configService.server.port;
  await app.listen(port);

  logger.log(
    `✨ Application running in ${configService.server.nodeEnv} mode on http://localhost:${port}`,
    'Bootstrap',
  );
  if (configService.server.nodeEnv !== 'production') {
    logger.log(
      `📚 API documentation available at http://localhost:${port}/api/docs`,
      'Bootstrap',
    );
  }

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    logger.log(
      `📤 Received ${signal}. Starting graceful shutdown...`,
      'Bootstrap',
    );

    // Give time for load balancer health checks to detect shutdown
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      await app.close();
      logger.log('✅ Graceful shutdown complete', 'Bootstrap');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during graceful shutdown', error, 'Bootstrap');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error, 'Bootstrap');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise }, 'Bootstrap');
  });
}

bootstrap().catch((err) => {
  // At this point, logger may not be initialized, so we use console.error
  // but in a production-safe manner (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Failed to start application:', err);
  }
  process.exit(1);
});
