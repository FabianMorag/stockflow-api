import { Test, TestingModule } from '@nestjs/testing'
import { MarketService } from './market.service'
import { PrismaService } from '../prisma/prisma.service'
import { StockService } from '../stocks/stock.service'

// Mock PrismaClient (ESM module with import.meta)
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      constructor() {}
      $connect = jest.fn().mockResolvedValue(undefined)
      $disconnect = jest.fn().mockResolvedValue(undefined)
      $on = jest.fn()
    },
    Decimal: class MockDecimal {
      constructor(private value: string | number) {}
      toNumber() {
        return Number(this.value)
      }
      toString() {
        return String(this.value)
      }
      valueOf() {
        return Number(this.value)
      }
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

describe('MarketService', () => {
  let service: MarketService
  let prisma: PrismaService

  const mockStock = {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 100.0,
    lastUpdated: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  }

  const mockPrismaService = {
    priceSnapshot: {
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
  }

  const mockStockService = {
    findAll: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StockService, useValue: mockStockService },
      ],
    }).compile()

    service = module.get<MarketService>(MarketService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('simulatePriceChange', () => {
    it('should return a price within ±5% of the original price', () => {
      const originalPrice = 100
      const newPrice = service.simulatePriceChange(originalPrice)

      expect(newPrice).toBeGreaterThanOrEqual(95)
      expect(newPrice).toBeLessThanOrEqual(105)
    })

    it('should return a positive price', () => {
      const originalPrice = 50
      const newPrice = service.simulatePriceChange(originalPrice)

      expect(newPrice).toBeGreaterThan(0)
    })

    it('should handle small prices correctly', () => {
      const originalPrice = 1
      const newPrice = service.simulatePriceChange(originalPrice)

      expect(newPrice).toBeGreaterThanOrEqual(0.95)
      expect(newPrice).toBeLessThanOrEqual(1.05)
    })

    it('should return a number type', () => {
      const result = service.simulatePriceChange(100)
      expect(typeof result).toBe('number')
    })
  })

  describe('recordPriceSnapshot', () => {
    it('should create a PriceSnapshot record with ticker and price', async () => {
      const mockSnapshot = {
        id: 'snapshot-1',
        stockTicker: 'AAPL',
        price: 102.5,
        recordedAt: new Date(),
      }
      mockPrismaService.priceSnapshot.create.mockResolvedValue(mockSnapshot)

      const result = await service.recordPriceSnapshot('AAPL', 102.5)

      expect(result).toEqual(mockSnapshot)
      expect(prisma.priceSnapshot.create).toHaveBeenCalledWith({
        data: {
          stockTicker: 'AAPL',
          price: 102.5,
        },
      })
    })
  })

  describe('updateAllStockPrices', () => {
    it('should iterate all stocks, simulate new prices, and update each', async () => {
      const stocks = [
        { ...mockStock, ticker: 'AAPL', currentPrice: 100 },
        { ...mockStock, ticker: 'GOOGL', currentPrice: 200 },
      ]
      mockStockService.findAll.mockResolvedValue(stocks)
      mockStockService.update.mockResolvedValue({
        ...mockStock,
        currentPrice: 105,
      })

      const result = await service.updateAllStockPrices()

      expect(mockStockService.findAll).toHaveBeenCalled()
      expect(mockStockService.update).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when no stocks exist', async () => {
      mockStockService.findAll.mockResolvedValue([])

      const result = await service.updateAllStockPrices()

      expect(result).toEqual([])
      expect(mockStockService.update).not.toHaveBeenCalled()
    })

    it('should record a price snapshot for each stock updated', async () => {
      const stocks = [{ ...mockStock, ticker: 'AAPL', currentPrice: 100 }]
      mockStockService.findAll.mockResolvedValue(stocks)
      mockStockService.update.mockResolvedValue({
        ...mockStock,
        currentPrice: 102,
      })
      mockPrismaService.priceSnapshot.create.mockResolvedValue({
        id: 'snap-1',
        stockTicker: 'AAPL',
        price: 102,
        recordedAt: new Date(),
      })

      await service.updateAllStockPrices()

      expect(mockPrismaService.priceSnapshot.create).toHaveBeenCalled()
    })
  })
})
