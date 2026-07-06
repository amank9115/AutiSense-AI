import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../src/cache/cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: 'REDIS_OPTIONS',
          useValue: {
            host: 'localhost',
            port: 6379,
          },
        },
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService);
  });

  describe('onModuleDestroy', () => {
    it('should not call quit() when Redis is not connected', async () => {
      const svc = cacheService as any;
      svc.isConnected = false;
      const quitSpy = jest
        .spyOn(svc.redisClient, 'quit')
        .mockResolvedValue('OK');
      const disconnectSpy = jest.spyOn(svc.redisClient, 'disconnect');

      await cacheService.onModuleDestroy();

      expect(quitSpy).not.toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should call quit() when Redis is connected', async () => {
      const svc = cacheService as any;
      svc.isConnected = true;
      const quitSpy = jest
        .spyOn(svc.redisClient, 'quit')
        .mockResolvedValue('OK');
      const disconnectSpy = jest.spyOn(svc.redisClient, 'disconnect');

      await cacheService.onModuleDestroy();

      expect(quitSpy).toHaveBeenCalled();
      expect(disconnectSpy).not.toHaveBeenCalled();
    });

    it('should handle quit() errors gracefully', async () => {
      const svc = cacheService as any;
      svc.isConnected = true;
      const quitSpy = jest
        .spyOn(svc.redisClient, 'quit')
        .mockRejectedValue(new Error('Connection closed'));
      const disconnectSpy = jest.spyOn(svc.redisClient, 'disconnect');

      await expect(cacheService.onModuleDestroy()).resolves.not.toThrow();
      expect(quitSpy).toHaveBeenCalled();
      expect(disconnectSpy).not.toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should set isConnected to true on successful connection', async () => {
      const svc = cacheService as any;
      const connectSpy = jest
        .spyOn(svc.redisClient, 'connect')
        .mockResolvedValue(undefined);

      await (cacheService as any).connect();

      expect(connectSpy).toHaveBeenCalled();
      expect(svc.isConnected).toBe(true);
    });

    it('should handle connection errors', async () => {
      const svc = cacheService as any;
      const connectSpy = jest
        .spyOn(svc.redisClient, 'connect')
        .mockRejectedValue(new Error('Connection failed'));

      await expect((cacheService as any).connect()).rejects.toThrow(
        'Connection failed',
      );
      expect(connectSpy).toHaveBeenCalled();
      expect(svc.isConnected).toBe(false);
    });
  });
});
