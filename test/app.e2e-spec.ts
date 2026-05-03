// Set env vars before ANY imports (ConfigModule validates at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3000';
process.env.JWT_SECRET = 'test-secret-for-e2e';
process.env.SUPABASE_URL = 'http://localhost:54321';

// Mock PrismaClient since the generated client uses ESM (import.meta)
jest.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    constructor(private options: Record<string, unknown> = {}) {}
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
    $on = jest.fn();
  },
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class MockPrismaPg {
    constructor(pool: unknown) {}
  },
}));

jest.mock('pg', () => ({
  Pool: class MockPool {
    end = jest.fn().mockResolvedValue(undefined);
  },
}));

// Mock jose (ESM-only library)
jest.mock('jose', () => ({
  jwtVerify: jest
    .fn()
    .mockResolvedValue({ payload: { sub: 'test-user', role: 'user' } }),
  createRemoteJWKSet: jest.fn().mockReturnValue({}),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.enableCors({ origin: 'http://localhost:5173', credentials: true });
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET) returns status ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.status).toBe('ok');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.timestamp).toBeDefined();
      });
  });

  it('/health (GET) returns CORS headers', () => {
    return request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200)
      .expect('access-control-allow-origin', 'http://localhost:5173');
  });
});
