import { Test, TestingModule } from '@nestjs/testing';
import { AiService, CHAT_MODEL } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentProcessor } from './document.processor';

jest.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({})),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: { screeningResult: { create: jest.fn() } },
        },
        {
          provide: DocumentProcessor,
          useValue: { processDocument: jest.fn() },
        },
        {
          provide: CHAT_MODEL,
          useValue: {}, // Mock chat model
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
