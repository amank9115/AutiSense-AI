import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigService } from '../config/config.service';
import { CacheModule } from '../cache/cache.module';
import { LockoutService } from './lockout.service';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: AppConfigService): JwtModuleOptions => ({
        secret: configService.auth.jwtSecret,
        signOptions: {
          expiresIn: (configService.auth.jwtExpiry ||
            '15m') as JwtSignOptions['expiresIn'],
        },
      }),
      inject: [AppConfigService],
    }),
    EmailModule,
    PrismaModule,
    CacheModule,
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
