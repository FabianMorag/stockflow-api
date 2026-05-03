// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { TradingService } from './trading.service'
import { PrismaService } from '#prisma/prisma.service'
import { StockService } from '#stocks/stock.service'
import { ProfileService } from '#profiles/profile.service'
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

describe('TradingService', () => {
  let service: TradingService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _prisma: PrismaService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _stockService: StockService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _profileService: ProfileService

  const mockProfileId = 'profile-1'
  const mockStock = {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 150.0,
    lastUpdated: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  }

  const mockProfile = {
    id: mockProfileId,
    email: 'test@test.com',
    username: 'testuser',
    balance: 10000,
    role: 'TRADER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockTransaction = {
    id: 'txn-1',
    profileId: mockProfileId,
    stockTicker: 'AAPL',
    type: 'BUY',
    quantity: 10,
    priceAtExecution: 150.0,
    totalAmount: 1500.0,
    timestamp: new Date('2024-01-01'),
  }

  const mockHolding = {
    id: 'holding-1',
    profileId: mockProfileId,
    stockTicker: 'AAPL',
    quantity: 10,
    averagePurchasePrice: 150.0,
    updatedAt: new Date('2024-01-01'),
  }

  const mockPrismaService = {
    $transaction: jest.fn(),
    transaction: {
      create: jest.fn(),
    },
    holding: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: {
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
  }

  const mockStockService = {
    findOne: jest.fn(),
  }

  const mockProfileService = {
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StockService, useValue: mockStockService },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).compile()

    service = module.get<TradingService>(TradingService)
    _prisma = module.get<PrismaService>(PrismaService)
    _stockService = module.get<StockService>(StockService)
    _profileService = module.get<ProfileService>(ProfileService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('buy', () => {
    const buyDto: BuyDto = { stockTicker: 'AAPL', quantity: 10 }

    it('should complete a buy transaction successfully', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock)
      mockProfileService.findOne.mockResolvedValue(mockProfile)

      const transactionResult = {
        transaction: mockTransaction,
        profile: { ...mockProfile, balance: 8500 },
        holding: mockHolding,
      }
      mockPrismaService.$transaction.mockResolvedValue(transactionResult)

      const result = await service.buy(mockProfileId, buyDto)

      expect(result).toEqual({
        id: 'txn-1',
        profileId: mockProfileId,
        stockTicker: 'AAPL',
        type: 'BUY',
        quantity: 10,
        priceAtExecution: 150.0,
        totalAmount: 1500.0,
        timestamp: mockTransaction.timestamp,
        newBalance: 8500,
        holdingQuantity: 10,
      })
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
    })

    it('should throw NotFoundException when stock does not exist', async () => {
      mockStockService.findOne.mockRejectedValue(
        new NotFoundException('Stock not found'),
      )

      await expect(service.buy(mockProfileId, buyDto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw BadRequestException when insufficient balance', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock)
      mockProfileService.findOne.mockResolvedValue({
        ...mockProfile,
        balance: 100,
      })

      await expect(service.buy(mockProfileId, buyDto)).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.buy(mockProfileId, buyDto)).rejects.toThrow(
        'Insufficient balance',
      )
    })

    it('should create new holding when buying first time', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock)
      mockProfileService.findOne.mockResolvedValue(mockProfile)

      const transactionResult = {
        transaction: mockTransaction,
        profile: { ...mockProfile, balance: 8500 },
        holding: mockHolding,
      }
      mockPrismaService.$transaction.mockResolvedValue(transactionResult)

      await service.buy(mockProfileId, buyDto)

      expect(mockPrismaService.$transaction).toHaveBeenCalled()
    })

    it('should update existing holding when buying more of same stock', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock)
      mockProfileService.findOne.mockResolvedValue(mockProfile)

      const transactionResult = {
        transaction: mockTransaction,
        profile: { ...mockProfile, balance: 8500 },
        holding: { ...mockHolding, quantity: 20 },
      }
      mockPrismaService.$transaction.mockResolvedValue(transactionResult)

      const result = await service.buy(mockProfileId, buyDto)

      expect(result.holdingQuantity).toBe(20)
    })
  })

  describe('sell', () => {
    const sellDto: SellDto = { stockTicker: 'AAPL', quantity: 5 }

    it('should complete a sell transaction successfully', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock)

      const transactionResult = {
        transaction: {
          ...mockTransaction,
          type: 'SELL',
          quantity: 5,
          totalAmount: 750.0,
        },
        profile: { ...mockProfile, balance: 10750 },
        holding: { ...mockHolding, quantity: 5 },
      }
      mockPrismaService.$transaction.mockResolvedValue(transactionResult)

      const result = await service.sell(mockProfileId, sellDto)

      expect(result).toEqual({
        id: 'txn-1',
        profileId: mockProfileId,
        stockTicker: 'AAPL',
        type: 'SELL',
        quantity: 5,
        priceAtExecution: 150.0,
        totalAmount: 750.0,
        timestamp: mockTransaction.timestamp,
        newBalance: 10750,
        holdingQuantity: 5,
      })
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
    })

    it('should throw NotFoundException when stock does not exist', async () => {
      mockStockService.findOne.mockRejectedValue(
        new NotFoundException('Stock not found'),
      )

      await expect(service.sell(mockProfileId, sellDto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw BadRequestException when insufficient holdings', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock)
      mockPrismaService.$transaction.mockRejectedValue(
        new BadRequestException('Insufficient holdings'),
      )

      await expect(service.sell(mockProfileId, sellDto)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should remove holding when selling all shares', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock)

      const transactionResult = {
        transaction: {
          ...mockTransaction,
          type: 'SELL',
          quantity: 10,
          totalAmount: 1500.0,
        },
        profile: { ...mockProfile, balance: 11500 },
        holding: null,
      }
      mockPrismaService.$transaction.mockResolvedValue(transactionResult)

      const result = await service.sell(mockProfileId, {
        stockTicker: 'AAPL',
        quantity: 10,
      })

      expect(result.holdingQuantity).toBe(0)
    })
  })
})
