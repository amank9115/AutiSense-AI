import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { LockoutService } from './lockout.service';
import { RefreshTokenService } from './refresh-token.service';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let moduleRef: TestingModule;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let lockoutService: jest.Mocked<LockoutService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashedPassword123',
    role: Role.parent,
    emailVerified: true,
    CreatedAt: new Date(),
    UpdatedAt: new Date(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findOne: jest.fn(), findById: jest.fn(), create: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), verify: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: { refreshToken: { create: jest.fn() } },
        },
        {
          provide: LockoutService,
          useValue: {
            checkLockout: jest.fn(),
            recordFailedAttempt: jest.fn(),
            clearLockout: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            createToken: jest.fn(),
            rotateToken: jest.fn(),
            revokeToken: jest.fn(),
            revokeAllUserTokens: jest.fn(),
            validateToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get(UsersService);
    jwtService = moduleRef.get(JwtService);
    lockoutService = moduleRef.get(LockoutService);
    refreshTokenService = moduleRef.get(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      usersService.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      lockoutService.checkLockout.mockResolvedValue(undefined);
      lockoutService.clearLockout.mockResolvedValue(undefined);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(lockoutService.checkLockout).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(lockoutService.clearLockout).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(usersService.findOne).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      usersService.findOne.mockResolvedValue(null);
      lockoutService.checkLockout.mockResolvedValue(undefined);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
      expect(lockoutService.recordFailedAttempt).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });

    it('should return null when password is incorrect', async () => {
      usersService.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);
      lockoutService.checkLockout.mockResolvedValue(undefined);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
      expect(lockoutService.recordFailedAttempt).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should not include passwordHash in returned user', async () => {
      usersService.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      lockoutService.checkLockout.mockResolvedValue(undefined);
      lockoutService.clearLockout.mockResolvedValue(undefined);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('id');
    });
  });

  describe('login', () => {
    it('should return access token, refresh token, and user data', async () => {
      jwtService.sign.mockReturnValue('mock-access-token');
      refreshTokenService.createToken.mockResolvedValue({
        token: 'mock-refresh-token',
        expiresAt: new Date(),
        familyId: 'family-123',
      });

      const result = await service.login(mockUser as User);

      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-123',
        role: Role.parent,
      });
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      jwtService.sign.mockReturnValue('mock-access-token');

      await expect(service.login(unverifiedUser as User)).rejects.toThrow();
    });

    it('should update refresh token service on login', async () => {
      jwtService.sign.mockReturnValue('mock-access-token');
      refreshTokenService.createToken.mockResolvedValue({
        token: 'mock-refresh-token',
        expiresAt: new Date(),
        familyId: 'family-123',
      });

      await service.login(mockUser as User);

      expect(refreshTokenService.createToken).toHaveBeenCalledWith('user-123');
    });
  });

  describe('refreshSession', () => {
    it('should return new access token and refresh token', async () => {
      const oldToken = 'old-refresh-token';
      refreshTokenService.rotateToken.mockResolvedValue({
        token: 'new-refresh-token',
        expiresAt: new Date(),
        userId: 'user-123',
      });
      usersService.findById.mockResolvedValue(mockUser as User);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshSession(oldToken);

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(refreshTokenService.rotateToken).toHaveBeenCalledWith(oldToken);
    });

    it('should throw NotFoundException when user not found', async () => {
      refreshTokenService.rotateToken.mockResolvedValue({
        token: 'new-refresh-token',
        expiresAt: new Date(),
        userId: 'nonexistent-user',
      });
      usersService.findById.mockResolvedValue(null);

      await expect(service.refreshSession('old-token')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should revoke refresh token and return message', async () => {
      refreshTokenService.revokeToken.mockResolvedValue(undefined);

      const result = await service.logout('refresh-token');

      expect(result.message).toBe('Logged out successfully');
      expect(refreshTokenService.revokeToken).toHaveBeenCalledWith(
        'refresh-token',
      );
    });

    it('should handle logout without token', async () => {
      const result = await service.logout(undefined);

      expect(result.message).toBe('Logged out successfully');
      expect(refreshTokenService.revokeToken).not.toHaveBeenCalled();
    });
  });

  describe('logoutAllSessions', () => {
    it('should revoke all user tokens and return count', async () => {
      refreshTokenService.revokeAllUserTokens.mockResolvedValue(3);

      const result = await service.logoutAllSessions('user-123');

      expect(result.message).toBe('All sessions have been logged out');
      expect(result.sessionsRevoked).toBe(3);
      expect(refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('register', () => {
    it('should create user and send verification email', async () => {
      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockUser,
        emailVerificationToken: 'verification-token',
      } as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const emailService = moduleRef.get(EmailService);
      (emailService.sendVerificationEmail as jest.Mock).mockResolvedValue({
        previewUrl: 'http://preview',
      });

      const result = await service.register({
        email: 'new@example.com',
        name: 'New User',
        password: 'Password123!',
        baseUrl: 'http://localhost:3000',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('check your email');
    });

    it('should throw ResourceConflictException when email exists', async () => {
      usersService.findOne.mockResolvedValue(mockUser as User);

      await expect(
        service.register({
          email: 'test@example.com',
          name: 'New User',
          password: 'Password123!',
        }),
      ).rejects.toThrow();
    });
  });
});
