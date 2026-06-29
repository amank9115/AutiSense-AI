import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { VersionMiddleware } from './version.middleware';
import { DeprecationInterceptor } from './deprecation.interceptor';
import { VersionController } from './version.controller';

@Module({
  controllers: [VersionController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DeprecationInterceptor,
    },
  ],
})
export class VersioningModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VersionMiddleware).forRoutes('api/*');
  }
}
