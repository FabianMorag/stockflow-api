// Set env vars BEFORE importing ConfigModule
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { AdminService } from './admin.service'
import { PrismaService } from '#prisma/prisma.service'
import { StockService } from '#stocks/stock.service'
import { ProfileService } from '#profiles/profile.service'
import { CreateTickerDto } from './dto/create-ticker.dto'
import { UpdateTickerDto } from './dto/update-ticker.dto'

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

describe('AdminService', () => {
  let service: AdminService
  let prisma: PrismaService

  const mockProfile = {
    id: 'profile-1',
    email: 'test@test.com',
    username: 'testuser',
    balance: 10000,
    role: 'TRADER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockStock = {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 150.0,
    lastUpdated: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  }

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    holding: {
      count: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
  }

  const mockProfileService = {
    findOne: jest.fn(),
  }

  const mockStockService = {
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProfileService, useValue: mockProfileService },
        { provide: StockService, useValue: mockStockService },
      ],
    }).compile()

    service = module.get<AdminService>(AdminService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('adjustBalance', () => {
    it('should increase profile balance with positive amount', async () => {
      mockProfileService.findOne.mockResolvedValue(mockProfile)
      mockPrismaService.profile.update.mockResolvedValue({
        ...mockProfile,
        balance: 10500,
      })

      const result = await service.adjustBalance('profile-1', 500)

      expect(result.balance).toBe(10500)
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: { balance: 10500 },
      })
    })

    it('should decrease profile balance with negative amount', async () => {
      mockProfileService.findOne.mockResolvedValue(mockProfile)
      mockPrismaService.profile.update.mockResolvedValue({
        ...mockProfile,
        balance: 9000,
      })

      const result = await service.adjustBalance('profile-1', -1000)

      expect(result.balance).toBe(9000)
    })

    it('should throw NotFoundException when profile does not exist', async () => {
      mockProfileService.findOne.mockRejectedValue(
        new NotFoundException('Profile not found'),
      )

      await expect(service.adjustBalance('nonexistent', 100)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('createTicker', () => {
    const createDto: CreateTickerDto = {
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 140.0,
    }

    it('should create and return a new stock', async () => {
      const createdStock = {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        currentPrice: 140.0,
        lastUpdated: new Date(),
        createdAt: new Date(),
      }
      mockPrismaService.stock.create.mockResolvedValue(createdStock)

      const result = await service.createTicker(createDto)

      expect(result.ticker).toBe('GOOGL')
      expect(result.name).toBe('Alphabet Inc.')
      expect(result.currentPrice).toBe(140.0)
      expect(result.lastUpdated).toBeInstanceOf(Date)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(prisma.stock.create).toHaveBeenCalledWith({
        data: {
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          currentPrice: 140.0,
        },
      })
    })

    it('should throw ConflictException when ticker already exists', async () => {
      const prismaError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
        meta: { target: ['ticker'] },
      })
      mockPrismaService.stock.create.mockImplementation(() => {
        throw prismaError
      })

      await expect(service.createTicker(createDto)).rejects.toThrow(
        ConflictException,
      )
    })
  })

  describe('updateTicker', () => {
    const updateDto: UpdateTickerDto = {
      name: 'Updated Apple',
      price: 175.0,
    }

    it('should update and return the stock when it exists', async () => {
      const updatedStock = {
        ...mockStock,
        name: 'Updated Apple',
        currentPrice: 175.0,
      }
      mockPrismaService.stock.findUnique.mockResolvedValue(mockStock)
      mockPrismaService.stock.update.mockResolvedValue(updatedStock)

      const result = await service.updateTicker('AAPL', updateDto)

      expect(result.name).toBe('Updated Apple')
      expect(result.currentPrice).toBe(175.0)
      expect(prisma.stock.update).toHaveBeenCalledWith({
        where: { ticker: 'AAPL' },
        data: { name: 'Updated Apple', currentPrice: 175.0 },
      })
    })

    it('should throw NotFoundException when stock does not exist', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(null)

      await expect(service.updateTicker('XYZ', updateDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('deleteTicker', () => {
    it('should delete stock when no active holdings exist', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(mockStock)
      mockPrismaService.holding.count.mockResolvedValue(0)
      mockPrismaService.stock.delete.mockResolvedValue(mockStock)

      const result = await service.deleteTicker('AAPL')

      expect(result.ticker).toBe('AAPL')
      expect(prisma.stock.delete).toHaveBeenCalledWith({
        where: { ticker: 'AAPL' },
      })
    })

    it('should throw ConflictException when stock has active holdings', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(mockStock)
      mockPrismaService.holding.count.mockResolvedValue(5)

      await expect(service.deleteTicker('AAPL')).rejects.toThrow(
        ConflictException,
      )
      await expect(service.deleteTicker('AAPL')).rejects.toThrow(
        'Cannot delete stock with active holdings',
      )
    })

    it('should throw NotFoundException when stock does not exist', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(null)

      await expect(service.deleteTicker('XYZ')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
