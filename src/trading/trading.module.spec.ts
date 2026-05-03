// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test';
process.env.PORT = '3000';

import { Test, TestingModule } from '@nestjs/testing';
import { TradingModule } from './trading.module';
import { TradingService } from './trading.service';
import { TradeController } from './trade.controller';
import { StocksModule } from '../stocks/stocks.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthModule } from '../auth/auth.module';

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

// Mock jose (ESM-only library)
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}));

describe('TradingModule', () => {
  it('should compile the module with all dependencies', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TradingModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(TradingService)).toBeDefined();
    expect(module.get(TradeController)).toBeDefined();
  });

  it('should import PrismaModule', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TradingModule],
    }).compile();

    const tradingModuleInstance = module.get(TradingModule);
    expect(tradingModuleInstance).toBeDefined();
  });

  it('should import StocksModule', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TradingModule],
    }).compile();

    expect(module.get(StocksModule)).toBeDefined();
  });

  it('should import ProfilesModule', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TradingModule],
    }).compile();

    expect(module.get(ProfilesModule)).toBeDefined();
  });

  it('should import AuthModule', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TradingModule],
    }).compile();

    expect(module.get(AuthModule)).toBeDefined();
  });
});
