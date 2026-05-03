// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { BuyDto } from './buy.dto'
import { SellDto } from './sell.dto'
import { TradeResponseDto } from './trade-response.dto'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'

describe('Trade DTOs', () => {
  describe('BuyDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(BuyDto, {
        stockTicker: 'AAPL',
        quantity: 10,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when stockTicker is missing', async () => {
      const dto = plainToInstance(BuyDto, { quantity: 10 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('stockTicker')
    })

    it('should fail validation when quantity is missing', async () => {
      const dto = plainToInstance(BuyDto, { stockTicker: 'AAPL' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('quantity')
    })

    it('should fail validation when quantity is zero or negative', async () => {
      const dto = plainToInstance(BuyDto, {
        stockTicker: 'AAPL',
        quantity: 0,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('quantity')
    })
  })

  describe('SellDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(SellDto, {
        stockTicker: 'AAPL',
        quantity: 5,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should fail validation when stockTicker is missing', async () => {
      const dto = plainToInstance(SellDto, { quantity: 5 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('stockTicker')
    })

    it('should fail validation when quantity is zero or negative', async () => {
      const dto = plainToInstance(SellDto, {
        stockTicker: 'AAPL',
        quantity: -1,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('quantity')
    })
  })

  describe('TradeResponseDto', () => {
    it('should have expected shape for buy response', () => {
      const dto = new TradeResponseDto()
      dto.id = 'txn-1'
      dto.profileId = 'profile-1'
      dto.stockTicker = 'AAPL'
      dto.type = 'BUY'
      dto.quantity = 10
      dto.priceAtExecution = 150.0
      dto.totalAmount = 1500.0
      dto.timestamp = new Date('2024-01-01')
      dto.newBalance = 8500.0
      dto.holdingQuantity = 10

      expect(dto.id).toBe('txn-1')
      expect(dto.type).toBe('BUY')
      expect(dto.totalAmount).toBe(1500.0)
      expect(dto.newBalance).toBe(8500.0)
    })

    it('should have expected shape for sell response', () => {
      const dto = new TradeResponseDto()
      dto.id = 'txn-2'
      dto.profileId = 'profile-1'
      dto.stockTicker = 'AAPL'
      dto.type = 'SELL'
      dto.quantity = 5
      dto.priceAtExecution = 160.0
      dto.totalAmount = 800.0
      dto.timestamp = new Date('2024-01-02')
      dto.newBalance = 10800.0
      dto.holdingQuantity = 5

      expect(dto.type).toBe('SELL')
      expect(dto.totalAmount).toBe(800.0)
      expect(dto.newBalance).toBe(10800.0)
    })
  })
})
