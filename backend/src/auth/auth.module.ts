import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigService } from '../config/config.service';
import { RedisModule } from '../redis/redis.module';
import { LockoutService } from './lockout.service';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: AppConfigService) => ({
        secret: configService.auth.jwtSecret,
        signOptions: { expiresIn: configService.auth.jwtExpiry || '15m' },
      }),
      inject: [AppConfigService],
    }),
    EmailModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    LockoutService,
    RefreshTokenService,
  ],
  exports: [AuthService, LockoutService, RefreshTokenService],
})
export class AuthModule {}
