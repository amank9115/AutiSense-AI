import { Test, TestingModule } from '@nestjs/testing';
import {
  CacheService,
  DEFAULT_CACHE_TTL,
  SHORT_CACHE_TTL,
  LONG_CACHE_TTL,
} from './cache.service';
import { AppConfigService } from '../config/config.service';
import Redis from 'ioredis';

// Create a properly mocked Redis class
const mockRedisMethods = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  decr: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  exists: jest.fn(),
  keys: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
};

// Mock the entire ioredis module
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => {
    return mockRedisMethods;
  });
  return MockRedis;
});

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    (mockRedisMethods.connect as jest.Mock).mockResolvedValue(undefined);
    (mockRedisMethods.on as jest.Mock).mockImplementation(function(this: any, event: string, callback: Function) {
      if (event === 'ready') {
        // Simulate ready event after a short delay
        setTimeout(() => callback(), 0);
      }
      return this;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: AppConfigService,
          useValue: {
            redis: { host: 'localhost', port: 6379 },
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed data when key exists', async () => {
      const testData = { id: 1, name: 'test' };
      mockRedisMethods.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedisMethods.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisMethods.get.mockResolvedValue(null);

      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedisMethods.get.mockRejectedValue(new Error('Connection failed'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      mockRedisMethods.setex.mockResolvedValue('OK');

      await service.set('test-key', { data: 'value' }, 300);

      expect(mockRedisMethods.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify({ data: 'value' }),
      );
    });

    it('should use default TTL when not specified', async () => {
      mockRedisMethods.setex.mockResolvedValue('OK');

      await service.set('test-key', { data: 'value' });

      expect(mockRedisMethods.setex).toHaveBeenCalledWith(
        'test-key',
        DEFAULT_CACHE_TTL,
        JSON.stringify({ data: 'value' }),
      );
    });

    it('should set without TTL when value is 0', async () => {
      mockRedisMethods.set.mockResolvedValue('OK');

      await service.set('test-key', { data: 'value' }, 0);

      expect(mockRedisMethods.set).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedisMethods.setex.mockRejectedValue(new Error('Write failed'));

      // Should not throw
      await expect(
        service.set('test-key', { data: 'value' }),
      ).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      mockRedisMethods.del.mockResolvedValue(1);

      await service.del('test-key');

      expect(mockRedisMethods.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      mockRedisMethods.del.mockRejectedValue(new Error('Delete failed'));

      await expect(service.del('test-key')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisMethods.exists.mockResolvedValue(1);

      const result = await service.exists('existing-key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedisMethods.exists.mockResolvedValue(0);

      const result = await service.exists('nonexistent-key');

      expect(result).toBe(false);
    });
  });

  describe('delPattern', () => {
    it('should delete all keys matching pattern', async () => {
      mockRedisMethods.keys.mockResolvedValue(['key:1', 'key:2', 'key:3']);
      mockRedisMethods.del.mockResolvedValue(3);

      const result = await service.delPattern('key:*');

      expect(result).toBe(3);
      expect(mockRedisMethods.keys).toHaveBeenCalledWith('key:*');
      expect(mockRedisMethods.del).toHaveBeenCalledWith('key:1', 'key:2', 'key:3');
    });

    it('should return 0 when no keys match pattern', async () => {
      mockRedisMethods.keys.mockResolvedValue([]);

      const result = await service.delPattern('nonexistent:*');

      expect(result).toBe(0);
      expect(mockRedisMethods.del).not.toHaveBeenCalled();
    });
  });

  describe('incr', () => {
    it('should increment counter', async () => {
      mockRedisMethods.incr.mockResolvedValue(5);

      const result = await service.incr('counter');

      expect(result).toBe(5);
      expect(mockRedisMethods.incr).toHaveBeenCalledWith('counter');
    });
  });

  describe('decr', () => {
    it('should decrement counter', async () => {
      mockRedisMethods.decr.mockResolvedValue(3);

      const result = await service.decr('counter');

      expect(result).toBe(3);
      expect(mockRedisMethods.decr).toHaveBeenCalledWith('counter');
    });
  });

  describe('expire', () => {
    it('should set expiration on key', async () => {
      mockRedisMethods.expire.mockResolvedValue(1);

      await service.expire('test-key', 300);

      expect(mockRedisMethods.expire).toHaveBeenCalledWith('test-key', 300);
    });
  });

  describe('ttl', () => {
    it('should return TTL of key', async () => {
      mockRedisMethods.ttl.mockResolvedValue(250);

      const result = await service.ttl('test-key');

      expect(result).toBe(250);
    });

    it('should return -1 for key without TTL', async () => {
      mockRedisMethods.ttl.mockResolvedValue(-1);

      const result = await service.ttl('test-key');

      expect(result).toBe(-1);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { id: 1 };
      mockRedisMethods.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = jest.fn().mockResolvedValue({ id: 2 });
      const result = await service.getOrSet('key', fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should execute fn and cache result if not exists', async () => {
      mockRedisMethods.get.mockResolvedValue(null);
      mockRedisMethods.setex.mockResolvedValue('OK');
      const fetchFn = jest.fn().mockResolvedValue({ id: 2 });

      const result = await service.getOrSet('key', fetchFn, 300);

      expect(result).toEqual({ id: 2 });
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedisMethods.setex).toHaveBeenCalledWith(
        'key',
        300,
        JSON.stringify({ id: 2 }),
      );
    });
  });

  describe('buildKey', () => {
    it('should concatenate parts with colon', () => {
      const key = service.buildKey('prefix', 'user', '123');

      expect(key).toBe('prefix:user:123');
    });

    it('should handle single part', () => {
      const key = service.buildKey('single');

      expect(key).toBe('single');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status', () => {
      (service as any).isConnected = true;
      expect(service.getConnectionStatus()).toBe(true);

      (service as any).isConnected = false;
      expect(service.getConnectionStatus()).toBe(false);
    });
  });

  describe('ping', () => {
    it('should return true when Redis responds PONG', async () => {
      mockRedisMethods.ping.mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockRedisMethods.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });

  describe('TTL constants', () => {
    it('should export correct TTL values', () => {
      expect(DEFAULT_CACHE_TTL).toBe(300);
      expect(SHORT_CACHE_TTL).toBe(60);
      expect(LONG_CACHE_TTL).toBe(3600);
    });
  });
});
