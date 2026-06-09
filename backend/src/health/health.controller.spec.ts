import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthCheckService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getHealth', () => {
    it('should return health status as ok', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('getReady', () => {
    it('should return ready status as ok when database is connected', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValueOnce([]);

      const result = await controller.getReady();

      expect(result.status).toBe('ok');
      expect(result.checks.db).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    it('should throw ServiceUnavailableException when database is down', async () => {
      jest
        .spyOn(prismaService, '$queryRaw')
        .mockRejectedValueOnce(new Error('Database connection failed'));

      try {
        await controller.getReady();
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
      }
    });
  });
});
