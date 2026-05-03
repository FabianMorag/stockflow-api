// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { TradeController } from './trade.controller'
import { TradingService } from './trading.service'
import { JwtUserPayload } from '../auth/decorators/current-user.decorator'
import { BuyDto } from './dto/buy.dto'
import { SellDto } from './dto/sell.dto'

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

describe('TradeController', () => {
  let controller: TradeController

  const mockUser: JwtUserPayload = { sub: 'profile-1' }

  const mockTradeResponse = {
    id: 'txn-1',
    profileId: 'profile-1',
    stockTicker: 'AAPL',
    type: 'BUY' as const,
    quantity: 10,
    priceAtExecution: 150.0,
    totalAmount: 1500.0,
    timestamp: new Date('2024-01-01'),
    newBalance: 8500.0,
    holdingQuantity: 10,
  }

  const mockTradingService = {
    buy: jest.fn(),
    sell: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradeController],
      providers: [{ provide: TradingService, useValue: mockTradingService }],
    }).compile()

    controller = module.get<TradeController>(TradeController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('buy', () => {
    const buyDto: BuyDto = { stockTicker: 'AAPL', quantity: 10 }

    it('should execute a buy and return trade response', async () => {
      mockTradingService.buy.mockResolvedValue(mockTradeResponse)

      const result = await controller.buy({ sub: 'profile-1' }, buyDto)

      expect(result).toEqual(mockTradeResponse)
      expect(mockTradingService.buy).toHaveBeenCalledWith('profile-1', buyDto)
    })

    it('should propagate BadRequestException from service', async () => {
      mockTradingService.buy.mockRejectedValue(
        new BadRequestException('Insufficient balance'),
      )

      await expect(controller.buy(mockUser, buyDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('sell', () => {
    const sellDto: SellDto = { stockTicker: 'AAPL', quantity: 5 }
    const sellResponse = {
      ...mockTradeResponse,
      type: 'SELL' as const,
      quantity: 5,
      totalAmount: 750.0,
      newBalance: 10750.0,
      holdingQuantity: 5,
    }

    it('should execute a sell and return trade response', async () => {
      mockTradingService.sell.mockResolvedValue(sellResponse)

      const result = await controller.sell({ sub: 'profile-1' }, sellDto)

      expect(result).toEqual(sellResponse)
      expect(mockTradingService.sell).toHaveBeenCalledWith('profile-1', sellDto)
    })

    it('should propagate BadRequestException from service', async () => {
      mockTradingService.sell.mockRejectedValue(
        new BadRequestException('Insufficient holdings'),
      )

      await expect(controller.sell(mockUser, sellDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })
})
