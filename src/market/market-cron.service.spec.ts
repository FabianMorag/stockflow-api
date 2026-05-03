import { Test, TestingModule } from '@nestjs/testing'
import { MarketCronService } from './market-cron.service'
import { MarketService } from './market.service'
import { MarketGateway } from './market.gateway'

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

describe('MarketCronService', () => {
  let service: MarketCronService

  const mockMarketService = {
    updateAllStockPrices: jest.fn(),
  }

  const mockMarketGateway = {
    emitPriceUpdate: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketCronService,
        { provide: MarketService, useValue: mockMarketService },
        { provide: MarketGateway, useValue: mockMarketGateway },
      ],
    }).compile()

    service = module.get<MarketCronService>(MarketCronService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('handleCron', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should call updateAllStockPrices from MarketService', async () => {
      mockMarketService.updateAllStockPrices.mockResolvedValue([])

      await service.handleCron()

      expect(mockMarketService.updateAllStockPrices).toHaveBeenCalled()
    })

    it('should emit price updates via WebSocket for each updated stock', async () => {
      const updatedStocks = [
        { ticker: 'AAPL', newPrice: 102.5 },
        { ticker: 'GOOGL', newPrice: 205.0 },
      ]
      mockMarketService.updateAllStockPrices.mockResolvedValue(updatedStocks)

      await service.handleCron()

      expect(mockMarketGateway.emitPriceUpdate).toHaveBeenCalledTimes(2)
      expect(mockMarketGateway.emitPriceUpdate).toHaveBeenCalledWith(
        'AAPL',
        102.5,
      )
      expect(mockMarketGateway.emitPriceUpdate).toHaveBeenCalledWith(
        'GOOGL',
        205.0,
      )
    })

    it('should not emit when no stocks are updated', async () => {
      mockMarketService.updateAllStockPrices.mockResolvedValue([])

      await service.handleCron()

      expect(mockMarketGateway.emitPriceUpdate).not.toHaveBeenCalled()
    })

    it('should log when cron executes', async () => {
      mockMarketService.updateAllStockPrices.mockResolvedValue([])
      const logSpy = jest.spyOn(console, 'log').mockImplementation()

      await service.handleCron()

      expect(logSpy).toHaveBeenCalled()
      logSpy.mockRestore()
    })
  })
})
