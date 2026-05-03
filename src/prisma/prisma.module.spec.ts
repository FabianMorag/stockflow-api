// Mock PrismaClient before any imports
jest.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    constructor(options: Record<string, unknown> = {}) {}
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
    $on = jest.fn();
  },
}));

// Mock the adapter and pg
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

// Set env before importing ConfigModule
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3000';

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaModule } from './prisma.module';
import { ConfigModule } from '../config/config.module';

describe('PrismaModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule, PrismaModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('should export PrismaService', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [ConfigModule, PrismaModule],
    }).compile();

    const exportedService = testingModule.get<PrismaService>(PrismaService);
    expect(exportedService).toBeInstanceOf(PrismaService);
  });
});
