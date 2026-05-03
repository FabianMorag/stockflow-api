import { Test, TestingModule } from '@nestjs/testing'
import { StocksModule } from './stocks.module'
import { StockController } from './stock.controller'
import { StockService } from './stock.service'
import { PrismaService } from '../prisma/prisma.service'

// Mock PrismaClient (ESM module with import.meta)
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

describe('StocksModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StocksModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        stock: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $on: jest.fn(),
      })
      .overrideProvider(StockService)
      .useValue({
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
      })
      .compile()

    expect(module).toBeDefined()
    expect(module.get(StocksModule)).toBeDefined()
    expect(module.get(StockController)).toBeDefined()
    expect(module.get(StockService)).toBeDefined()
  })
})
