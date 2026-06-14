import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create a new refresh token', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        tokenHash: 'some-hash',
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      };

      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue(
        mockToken,
      );

      const result = await service.createToken('user-123');

      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.familyId).toBeDefined();
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          familyId: expect.any(String),
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should store hashed token in database', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        tokenHash: expect.not.stringMatching(/^[A-Za-z0-9_=-]+$/), // Should be hashed, not raw
        familyId: 'family-123',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      };

      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue(
        mockToken,
      );

      await service.createToken('user-123');

      const createCall = (prismaService.refreshToken.create as jest.Mock).mock
        .calls[0][0];
      expect(createCall.data.tokenHash).toBeDefined();
      // Token hash should be a SHA-256 hash (64 characters hex)
      expect(createCall.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should create new family when no previous token hash provided', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        tokenHash: 'hash',
        familyId: expect.any(String),
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      };

      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue(
        mockToken,
      );

      const result = await service.createToken('user-123');

      expect(result.familyId).toBeDefined();
    });
  });

  describe('validateToken', () => {
    it('should return token data for valid token', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        tokenHash: 'some-hash',
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        revokedAt: null,
        createdAt: new Date(),
      };

      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken,
      );

      const result = await service.validateToken('valid-token');

      expect(result.userId).toBe('user-123');
      expect(result.familyId).toBe('family-123');
      expect(result.tokenId).toBe('token-id');
    });

    it('should throw UnauthorizedException for non-existent token', async () => {
      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if token is revoked', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        tokenHash: 'some-hash',
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revokedAt: new Date(), // Token is revoked
        createdAt: new Date(),
      };

      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken,
      );
      (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await expect(service.validateToken('revoked-token')).rejects.toThrow();
    });

    it('should throw if token is expired', async () => {
      const mockToken = {
        id: 'token-id',
        userId: 'user-123',
        tokenHash: 'some-hash',
        familyId: 'family-123',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 1 day ago
        revokedAt: null,
        createdAt: new Date(),
      };

      (prismaService.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken,
      );

      await expect(service.validateToken('expired-token')).rejects.toThrow();
    });
  });

  describe('revokeToken', () => {
    it('should update token with revokedAt timestamp', async () => {
      (prismaService.refreshToken.update as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.revokeToken('token-to-revoke');

      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all non-revoked tokens for user', async () => {
      (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      const count = await service.revokeAllUserTokens('user-123');

      expect(count).toBe(3);
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should return 0 when no tokens to revoke', async () => {
      (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      const count = await service.revokeAllUserTokens('user-with-no-tokens');

      expect(count).toBe(0);
    });
  });

  describe('rotateToken', () => {
    it('should validate, revoke old, and create new token', async () => {
      const oldToken = {
        id: 'old-token-id',
        userId: 'user-123',
        tokenHash: 'hash',
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      };

      const newToken = {
        id: 'new-token-id',
        userId: 'user-123',
        tokenHash: 'new-hash',
        familyId: 'family-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      };

      // First call returns old token valid, second call returns null (old token now revoked)
      (prismaService.refreshToken.findUnique as jest.Mock)
        .mockResolvedValueOnce(oldToken)
        .mockResolvedValueOnce(null);
      (prismaService.refreshToken.update as jest.Mock).mockResolvedValue(
        undefined,
      );
      (prismaService.refreshToken.create as jest.Mock).mockResolvedValue(
        newToken,
      );

      const result = await service.rotateToken('old-token');

      expect(result.token).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return count of active sessions', async () => {
      (prismaService.refreshToken.count as jest.Mock).mockResolvedValue(2);

      const count = await service.getActiveSessionCount('user-123');

      expect(count).toBe(2);
    });

    it('should exclude revoked and expired tokens', async () => {
      (prismaService.refreshToken.count as jest.Mock).mockResolvedValue(1);

      await service.getActiveSessionCount('user-123');

      expect(prismaService.refreshToken.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      const count = await service.cleanupExpiredTokens();

      expect(count).toBe(5);
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });
});
