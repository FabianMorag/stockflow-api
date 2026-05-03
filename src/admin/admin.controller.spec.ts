// Set env vars BEFORE importing ConfigModule
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { CreateTickerDto } from './dto/create-ticker.dto'
import { UpdateTickerDto } from './dto/update-ticker.dto'
import { AdjustBalanceDto } from './dto/adjust-balance.dto'

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

describe('AdminController', () => {
  let controller: AdminController
  let adminService: AdminService

  const mockAdminService = {
    adjustBalance: jest.fn(),
    createTicker: jest.fn(),
    updateTicker: jest.fn(),
    deleteTicker: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    }).compile()

    controller = module.get<AdminController>(AdminController)
    adminService = module.get<AdminService>(AdminService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('adjustBalance', () => {
    it('should call adminService.adjustBalance with correct params', async () => {
      const dto: AdjustBalanceDto = { amount: 500 }
      mockAdminService.adjustBalance.mockResolvedValue({
        id: 'profile-1',
        balance: 10500,
      })

      const result = await controller.adjustBalance('profile-1', dto)

      expect(result).toEqual({ id: 'profile-1', balance: 10500 })
      expect(adminService.adjustBalance).toHaveBeenCalledWith('profile-1', 500)
    })

    it('should handle negative amounts', async () => {
      const dto: AdjustBalanceDto = { amount: -1000 }
      mockAdminService.adjustBalance.mockResolvedValue({
        id: 'profile-1',
        balance: 9000,
      })

      const result = await controller.adjustBalance('profile-1', dto)

      expect(result.balance).toBe(9000)
      expect(adminService.adjustBalance).toHaveBeenCalledWith(
        'profile-1',
        -1000,
      )
    })
  })

  describe('createTicker', () => {
    it('should call adminService.createTicker with correct dto', async () => {
      const dto: CreateTickerDto = {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 140.0,
      }
      mockAdminService.createTicker.mockResolvedValue({
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        currentPrice: 140.0,
      })

      const result = await controller.createTicker(dto)

      expect(result.ticker).toBe('GOOGL')
      expect(adminService.createTicker).toHaveBeenCalledWith(dto)
    })
  })

  describe('updateTicker', () => {
    it('should call adminService.updateTicker with correct params', async () => {
      const dto: UpdateTickerDto = { name: 'Updated', price: 200.0 }
      mockAdminService.updateTicker.mockResolvedValue({
        ticker: 'AAPL',
        name: 'Updated',
        currentPrice: 200.0,
      })

      const result = await controller.updateTicker('AAPL', dto)

      expect(result.name).toBe('Updated')
      expect(adminService.updateTicker).toHaveBeenCalledWith('AAPL', dto)
    })
  })

  describe('deleteTicker', () => {
    it('should call adminService.deleteTicker with correct ticker', async () => {
      mockAdminService.deleteTicker.mockResolvedValue({
        ticker: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 150.0,
      })

      const result = await controller.deleteTicker('AAPL')

      expect(result.ticker).toBe('AAPL')
      expect(adminService.deleteTicker).toHaveBeenCalledWith('AAPL')
    })
  })
})
