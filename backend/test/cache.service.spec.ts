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
      // Arrange
      cacheService['isConnected'] = false;
      const quitSpy = jest.spyOn(cacheService['redisClient'], 'quit').mockResolvedValue('OK');
      const disconnectSpy = jest.spyOn(cacheService['redisClient'], 'disconnect');

      // Act
      await cacheService.onModuleDestroy();

      // Assert
      expect(quitSpy).not.toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should call quit() when Redis is connected', async () => {
      // Arrange
      cacheService['isConnected'] = true;
      const quitSpy = jest.spyOn(cacheService['redisClient'], 'quit').mockResolvedValue('OK');
      const disconnectSpy = jest.spyOn(cacheService['redisClient'], 'disconnect');

      // Act
      await cacheService.onModuleDestroy();

      // Assert
      expect(quitSpy).toHaveBeenCalled();
      expect(disconnectSpy).not.toHaveBeenCalled();
    });

    it('should handle quit() errors gracefully', async () => {
      // Arrange
      cacheService['isConnected'] = true;
      const quitSpy = jest.spyOn(cacheService['redisClient'], 'quit').mockRejectedValue(new Error('Connection closed'));
      const disconnectSpy = jest.spyOn(cacheService['redisClient'], 'disconnect');

      // Act & Assert
      await expect(cacheService.onModuleDestroy()).resolves.not.toThrow();
      expect(quitSpy).toHaveBeenCalled();
      expect(disconnectSpy).not.toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should set isConnected to true on successful connection', async () => {
      // Arrange
      const connectSpy = jest.spyOn(cacheService['redisClient'], 'connect').mockResolvedValue(undefined);

      // Act
      await cacheService.connect();

      // Assert
      expect(connectSpy).toHaveBeenCalled();
      expect(cacheService['isConnected']).toBe(true);
    });

    it('should handle connection errors', async () => {
      // Arrange
      const connectSpy = jest.spyOn(cacheService['redisClient'], 'connect').mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(cacheService.connect()).rejects.toThrow('Connection failed');
      expect(connectSpy).toHaveBeenCalled();
      expect(cacheService['isConnected']).toBe(false);
    });
  });
});