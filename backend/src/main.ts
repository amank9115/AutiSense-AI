import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppConfigService } from './config/config.service';
import { LoggerService } from './common/logging';
import { HttpLoggerMiddleware } from './common/logging/http-logger.middleware';
import cookieParser from 'cookie-parser';

// Security headers with Helmet (requires: npm install helmet @types/helmet)
// import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);
  const logger = app.get(LoggerService);

  // Security headers - uncomment after installing helmet:
  // app.use(helmet({
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'"],
  //       scriptSrc: ["'self'", "'unsafe-inline'"],
  //       styleSrc: ["'self'", "'unsafe-inline'"],
  //       imgSrc: ["'self'", "data:", "https:"],
  //       connectSrc: ["'self'"],
  //       fontSrc: ["'self'"],
  //       objectSrc: ["'none'"],
  //       upgradeInsecureRequests: [],
  //     },
  //   },
  //   crossOriginEmbedderPolicy: false,
  //   crossOriginResourcePolicy: { policy: "cross-origin" },
  // }));

  // Get allowed origins from environment
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:4000')
    .split(',')
    .map(origin => origin.trim());

  // CORS configuration - environment-based
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'Accept'],
  });

  app.use(cookieParser());

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

  // Swagger/OpenAPI documentation
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

  const port = configService.server.port;
  await app.listen(port);
  
  logger.log(
    `✨ Application running in ${configService.server.nodeEnv} mode on http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(
    `📚 API documentation available at http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
