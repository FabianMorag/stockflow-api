// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test';
process.env.PORT = '3000';

import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { MockJwtAuthGuard } from './guards/mock-jwt-auth.guard';
import { SupabaseJwtAuthGuard } from './guards/supabase-jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

// Mock PrismaClient (ESM module with import.meta) — required for transitive imports
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      constructor() {}
      $connect = jest.fn().mockResolvedValue(undefined);
      $disconnect = jest.fn().mockResolvedValue(undefined);
      $on = jest.fn();
    },
  };
});

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class MockPrismaPg {
    constructor() {}
  },
}));

jest.mock('pg', () => ({
  Pool: class MockPool {
    end = jest.fn().mockResolvedValue(undefined);
  },
}));

// Mock jose (ESM-only library)
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}));

describe('AuthModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn(),
      })
      .compile();

    expect(module).toBeDefined();
    expect(module.get(AuthModule)).toBeDefined();
    expect(module.get(MockJwtAuthGuard)).toBeDefined();
    expect(module.get(SupabaseJwtAuthGuard)).toBeDefined();
  });
});
