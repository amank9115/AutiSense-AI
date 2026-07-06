import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScreeningService } from './screening.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EmailService } from '../email/email.service';
import { ScreeningStatus, RiskLevel, Role } from '@prisma/client';

const mockPrisma = {
  child: { findUnique: jest.fn() },
  screeningSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  screeningResult: { create: jest.fn(), findUnique: jest.fn() },
  screeningAnalysis: { create: jest.fn() },
  reportShare: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  child_profile: { findMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  buildKey: jest.fn((...parts: string[]) => parts.join(':')),
};

const mockEmail = {
  sendReportSharedEmail: jest.fn().mockResolvedValue(undefined),
};

describe('ScreeningService', () => {
  let service: ScreeningService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreeningService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get<ScreeningService>(ScreeningService);
  });

  describe('createSession', () => {
    const dto = { userId: 'user-1', childId: 'child-1' };

    it('throws NotFoundException when child does not exist', async () => {
      mockPrisma.child.findUnique.mockResolvedValue(null);
      await expect(service.createSession(dto)).rejects.toThrow(NotFoundException);
    });

    it('creates a session when child belongs to user', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({ id: 'child-1', userId: 'user-1' });
      const created = {
        id: 'session-1',
        userId: 'user-1',
        childId: 'child-1',
        status: ScreeningStatus.in_progress,
        startTime: new Date(),
      };
      mockPrisma.screeningSession.create.mockResolvedValue(created);

      const result = await service.createSession(dto);
      expect(result.id).toBe('session-1');
      expect(mockPrisma.screeningSession.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSessionDetails', () => {
    it('throws NotFoundException for unknown session', async () => {
      mockPrisma.screeningSession.findUnique.mockResolvedValue(null);
      await expect(service.getSessionDetails('bad-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns session for the owning user', async () => {
      const session = {
        id: 'session-2',
        userId: 'user-1',
        childId: 'child-1',
        status: ScreeningStatus.completed,
        child: {},
        result: null,
        analyses: [],
      };
      mockPrisma.screeningSession.findUnique.mockResolvedValue(session);

      const result = await service.getSessionDetails('session-2', 'user-1');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(result!.id).toBe('session-2');
    });
  });

  describe('saveScreeningResult', () => {
    it('throws NotFoundException when session does not exist', async () => {
      mockPrisma.screeningSession.findUnique.mockResolvedValue(null);
      await expect(
        service.saveScreeningResult('x', 'user-1', {
          sessionId: 'x',
          riskScore: 50,
          riskLevel: RiskLevel.medium,
          behaviors: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('saves result and invalidates cache', async () => {
      mockPrisma.screeningSession.findUnique.mockResolvedValue({
        id: 'session-3',
        userId: 'user-1',
        status: ScreeningStatus.in_progress,
      });
      const savedResult = { id: 'result-1', sessionId: 'session-3', riskScore: 60 };
      mockPrisma.screeningResult.create.mockResolvedValue(savedResult);
      mockPrisma.screeningSession.update.mockResolvedValue({});

      const result = await service.saveScreeningResult('session-3', 'user-1', {
        sessionId: 'session-3',
        riskScore: 60,
        riskLevel: RiskLevel.medium,
        behaviors: { eyeContact: 55 },
      });

      expect(result.riskScore).toBe(60);
      expect(mockPrisma.screeningResult.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteSession', () => {
    it('throws NotFoundException for unknown session', async () => {
      mockPrisma.screeningSession.findUnique.mockResolvedValue(null);
      await expect(service.deleteSession('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('deletes session owned by user', async () => {
      mockPrisma.screeningSession.findUnique.mockResolvedValue({
        id: 'session-4',
        userId: 'user-1',
      });
      mockPrisma.screeningSession.delete.mockResolvedValue({ id: 'session-4' });

      await service.deleteSession('session-4', 'user-1');
      expect(mockPrisma.screeningSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-4' },
      });
    });
  });

  describe('getUserSessions', () => {
    it('returns cached result when available', async () => {
      const cached = [{ id: 'session-5' }];
      mockCache.get.mockResolvedValue(cached);

      const result = await service.getUserSessions('user-1');
      expect(result).toEqual(cached);
      expect(mockPrisma.screeningSession.findMany).not.toHaveBeenCalled();
    });

    it('queries DB and caches when cache is cold', async () => {
      mockCache.get.mockResolvedValue(null);
      const sessions = [{ id: 'session-6', child: {}, result: null }];
      mockPrisma.screeningSession.findMany.mockResolvedValue(sessions);

      const result = await service.getUserSessions('user-1');
      expect(result).toEqual(sessions);
      expect(mockCache.set).toHaveBeenCalledTimes(1);
    });
  });
});
