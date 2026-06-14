import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { AppConfigService } from '../config/config.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: AppConfigService,
          useValue: {
            database: { url: 'postgresql://test:test@localhost:5432/test' },
            server: { nodeEnv: 'test' },
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
