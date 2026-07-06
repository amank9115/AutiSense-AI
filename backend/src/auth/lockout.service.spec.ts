import { Test, TestingModule } from '@nestjs/testing';
import { AccountLockedException } from '../common/exceptions';
import { LockoutService } from './lockout.service';
import { CacheService } from '../cache/cache.service';

describe('LockoutService', () => {
  let service: LockoutService;
  let redisService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockoutService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
            ttl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LockoutService>(LockoutService);
    redisService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLockout', () => {
    it('should not throw when account is not locked', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(
        service.checkLockout('test@example.com'),
      ).resolves.not.toThrow();
      expect(redisService.get).toHaveBeenCalledWith(
        'auth:lockout:test@example.com',
      );
    });

    it('should throw AccountLockedException when account is locked', async () => {
      redisService.get.mockResolvedValue('5');
      redisService.ttl.mockResolvedValue(300); // 5 minutes remaining

      await expect(service.checkLockout('test@example.com')).rejects.toThrow(
        AccountLockedException,
      );
      expect(redisService.ttl).toHaveBeenCalled();
    });

    it('should include remaining time in error message', async () => {
      redisService.get.mockResolvedValue('5');
      redisService.ttl.mockResolvedValue(300); // 5 minutes

      try {
        await service.checkLockout('test@example.com');
        fail('Should have thrown');
      } catch (error) {
        expect((error as AccountLockedException).message).toContain('5 minute');
      }
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempt counter', async () => {
      redisService.incr.mockResolvedValue(1);
      redisService.expire.mockResolvedValue(undefined);

      await service.recordFailedAttempt('test@example.com');

      expect(redisService.incr).toHaveBeenCalledWith(
        'auth:lockout:test@example.com',
      );
      expect(redisService.expire).toHaveBeenCalled();
    });

    it('should not set expiration on subsequent failures', async () => {
      redisService.incr.mockResolvedValue(2); // Already at 2 attempts

      await service.recordFailedAttempt('test@example.com');

      expect(redisService.incr).toHaveBeenCalled();
      expect(redisService.expire).not.toHaveBeenCalled();
    });
  });

  describe('clearLockout', () => {
    it('should delete the lockout key', async () => {
      redisService.del.mockResolvedValue(undefined);

      await service.clearLockout('test@example.com');

      expect(redisService.del).toHaveBeenCalledWith(
        'auth:lockout:test@example.com',
      );
    });
  });

  describe('getFailedAttempts', () => {
    it('should return current failed attempt count', async () => {
      redisService.get.mockResolvedValue('3');

      const count = await service.getFailedAttempts('test@example.com');

      expect(count).toBe(3);
    });

    it('should return 0 when no attempts recorded', async () => {
      redisService.get.mockResolvedValue(null);

      const count = await service.getFailedAttempts('test@example.com');

      expect(count).toBe(0);
    });
  });

  describe('getRemainingLockoutTime', () => {
    it('should return remaining time in seconds', async () => {
      redisService.ttl.mockResolvedValue(300); // 5 minutes

      const remaining =
        await service.getRemainingLockoutTime('test@example.com');

      expect(remaining).toBe(300);
    });

    it('should return -1 when key does not exist', async () => {
      redisService.ttl.mockResolvedValue(-2); // -2 indicates no TTL

      const remaining =
        await service.getRemainingLockoutTime('test@example.com');

      expect(remaining).toBe(-1);
    });
  });

  describe('unlockAccount', () => {
    it('should delete the lockout key', async () => {
      redisService.del.mockResolvedValue(undefined);

      await service.unlockAccount('test@example.com');

      expect(redisService.del).toHaveBeenCalledWith(
        'auth:lockout:test@example.com',
      );
    });
  });

  describe('getConfig', () => {
    it('should return current lockout configuration', () => {
      const config = service.getConfig();

      expect(config).toHaveProperty('maxFailedAttempts');
      expect(config).toHaveProperty('lockoutDurationSeconds');
      expect(typeof config.maxFailedAttempts).toBe('number');
      expect(typeof config.lockoutDurationSeconds).toBe('number');
    });
  });

  describe('configuration via environment', () => {
    it('should use default values when env vars not set', () => {
      const config = service.getConfig();

      expect(config.maxFailedAttempts).toBe(5);
      expect(config.lockoutDurationSeconds).toBe(900); // 15 minutes
    });
  });
});
