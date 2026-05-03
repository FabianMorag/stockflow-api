// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { PortfolioController } from './portfolio.controller'
import { PortfolioService } from './portfolio.service'

// Mock PrismaClient (ESM module with import.meta) — required for transitive imports
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

describe('PortfolioController', () => {
  let controller: PortfolioController

  const mockProfileId = 'profile-1'

  const mockHoldings = [
    {
      stockTicker: 'AAPL',
      stockName: 'Apple Inc.',
      quantity: 10,
      averagePurchasePrice: 140.0,
      currentPrice: 150.0,
      marketValue: 1500.0,
      gainLoss: 100.0,
      gainLossPercentage: 7.14,
    },
  ]

  const mockNetWorth = {
    profileId: mockProfileId,
    balance: 10000,
    holdingsValue: 1500.0,
    netWorth: 11500.0,
  }

  const mockTransactionHistory = {
    transactions: [
      {
        id: 'txn-1',
        stockTicker: 'AAPL',
        type: 'BUY' as const,
        quantity: 10,
        priceAtExecution: 140.0,
        totalAmount: 1400.0,
        timestamp: new Date('2024-01-01'),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  }

  const mockPortfolioService = {
    getHoldings: jest.fn(),
    getNetWorth: jest.fn(),
    getTransactionHistory: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    }).compile()

    controller = module.get<PortfolioController>(PortfolioController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getHoldings', () => {
    it('should return holdings for the authenticated user', async () => {
      mockPortfolioService.getHoldings.mockResolvedValue(mockHoldings)

      const result = await controller.getHoldings({
        sub: mockProfileId,
      })

      expect(result).toEqual(mockHoldings)
      expect(mockPortfolioService.getHoldings).toHaveBeenCalledWith(
        mockProfileId,
      )
    })
  })

  describe('getNetWorth', () => {
    it('should return net worth summary for the authenticated user', async () => {
      mockPortfolioService.getNetWorth.mockResolvedValue(mockNetWorth)

      const result = await controller.getNetWorth({
        sub: mockProfileId,
      })

      expect(result).toEqual(mockNetWorth)
      expect(mockPortfolioService.getNetWorth).toHaveBeenCalledWith(
        mockProfileId,
      )
    })
  })

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history for the authenticated user', async () => {
      mockPortfolioService.getTransactionHistory.mockResolvedValue(
        mockTransactionHistory,
      )

      const result = await controller.getTransactionHistory(
        { sub: mockProfileId },
        '1',
        '10',
      )

      expect(result).toEqual(mockTransactionHistory)
      expect(mockPortfolioService.getTransactionHistory).toHaveBeenCalledWith(
        mockProfileId,
        { page: 1, limit: 10 },
      )
    })

    it('should pass type filter when provided', async () => {
      mockPortfolioService.getTransactionHistory.mockResolvedValue({
        ...mockTransactionHistory,
        transactions: [],
        total: 0,
        totalPages: 0,
      })

      await controller.getTransactionHistory(
        { sub: mockProfileId },
        '1',
        '10',
        'BUY',
      )

      expect(mockPortfolioService.getTransactionHistory).toHaveBeenCalledWith(
        mockProfileId,
        { page: 1, limit: 10, type: 'BUY' },
      )
    })

    it('should pass stockTicker filter when provided', async () => {
      mockPortfolioService.getTransactionHistory.mockResolvedValue({
        ...mockTransactionHistory,
        transactions: [],
        total: 0,
        totalPages: 0,
      })

      await controller.getTransactionHistory(
        { sub: mockProfileId },
        '1',
        '10',
        undefined,
        'AAPL',
      )

      expect(mockPortfolioService.getTransactionHistory).toHaveBeenCalledWith(
        mockProfileId,
        { page: 1, limit: 10, stockTicker: 'AAPL' },
      )
    })
  })
})
