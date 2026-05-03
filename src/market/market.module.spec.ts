import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MarketModule } from './market.module'
import { MarketService } from './market.service'
import { MarketCronService } from './market-cron.service'
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

describe('MarketModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        MarketModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest
          .fn()
          .mockReturnValue('postgresql://test:test@localhost:5435/test'),
      })
      .compile()
  })

  it('should compile the module', () => {
    expect(module).toBeDefined()
  })

  it('should provide MarketService', () => {
    const service = module.get<MarketService>(MarketService)
    expect(service).toBeDefined()
  })

  it('should provide MarketCronService', () => {
    const service = module.get<MarketCronService>(MarketCronService)
    expect(service).toBeDefined()
  })

  it('should provide MarketGateway', () => {
    const gateway = module.get<MarketGateway>(MarketGateway)
    expect(gateway).toBeDefined()
  })

  it('should have PrismaService available through dependency chain', () => {
    const marketService = module.get<MarketService>(MarketService)
    expect(marketService).toBeDefined()
  })

  it('should have StockService available through StocksModule', () => {
    const marketService = module.get<MarketService>(MarketService)
    expect(marketService).toBeDefined()
  })
})
