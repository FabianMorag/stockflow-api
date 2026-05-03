// Set env vars BEFORE importing ConfigModule
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { AdminModule } from './admin.module'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AdminGuard } from './guards/admin.guard'
import { PrismaService } from '#prisma/prisma.service'
import { ProfileService } from '#profiles/profile.service'
import { StockService } from '#stocks/stock.service'

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      constructor() {}
      $connect = jest.fn().mockResolvedValue(undefined)
      $disconnect = jest.fn().mockResolvedValue(undefined)
      $on = jest.fn()
    },
  }
})

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class MockPrismaPg {
    constructor() {}
  },
}))

jest.mock('pg', () => ({
  Pool: class MockPool {
    end = jest.fn().mockResolvedValue(undefined)
  },
}))

// Mock jose (ESM module used by SupabaseJwtAuthGuard)
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}))

describe('AdminModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AdminModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        profile: { findUnique: jest.fn(), update: jest.fn() },
        stock: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        holding: { count: jest.fn() },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $on: jest.fn(),
      })
      .overrideProvider(ProfileService)
      .useValue({ findOne: jest.fn() })
      .overrideProvider(StockService)
      .useValue({ findOne: jest.fn() })
      .compile()

    expect(module).toBeDefined()
    expect(module.get(AdminModule)).toBeDefined()
    expect(module.get(AdminController)).toBeDefined()
    expect(module.get(AdminService)).toBeDefined()
    expect(module.get(AdminGuard)).toBeDefined()
  })
})
