import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBe('Hello World!');
        expect(res.body.message).toBe('Success');
        expect(res.body.timestamp).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  describe('GET /health', () => {
    it('should return 200 with ok status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
          expect(typeof res.body.timestamp).toBe('string');
        });
    });
  });

  describe('GET /ready', () => {
    it('should return 200 with ok status when database is available', () => {
      return request(app.getHttpServer())
        .get('/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.checks).toBeDefined();
          expect(res.body.checks.db).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
          expect(typeof res.body.timestamp).toBe('string');
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
