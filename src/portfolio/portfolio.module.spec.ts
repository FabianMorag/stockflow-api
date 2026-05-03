// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test';
process.env.PORT = '3000';

import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioModule } from './portfolio.module';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StocksModule } from '../stocks/stocks.module';
import { ProfilesModule } from '../profiles/profiles.module';

// Mock PrismaClient (ESM module with import.meta)
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

// Mock jose (ESM-only module used by SupabaseJwtAuthGuard)
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}));

describe('PortfolioModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortfolioModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(PortfolioController)).toBeDefined();
    expect(module.get(PortfolioService)).toBeDefined();
  });

  it('should import PrismaModule', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortfolioModule],
    }).compile();

    const prismaModule = module.get(PrismaModule);
    expect(prismaModule).toBeDefined();
  });

  it('should import StocksModule', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortfolioModule],
    }).compile();

    const stocksModule = module.get(StocksModule);
    expect(stocksModule).toBeDefined();
  });

  it('should import ProfilesModule', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortfolioModule],
    }).compile();

    const profilesModule = module.get(ProfilesModule);
    expect(profilesModule).toBeDefined();
  });
});
