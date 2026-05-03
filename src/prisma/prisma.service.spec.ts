import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from './prisma.service'

// Mock PrismaClient since the generated client uses ESM (import.meta)
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      constructor(private options: Record<string, unknown> = {}) {}
      $connect = jest.fn().mockResolvedValue(undefined)
      $disconnect = jest.fn().mockResolvedValue(undefined)
      $on = jest.fn()
    },
  }
})

// Mock the adapter and pg
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

describe('PrismaService', () => {
  let service: PrismaService
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue('postgresql://test:test@localhost:5432/test'),
          },
        },
      ],
    }).compile()

    service = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should expose $connect method', () => {
    expect(service.$connect).toBeDefined()
    expect(typeof service.$connect).toBe('function')
  })

  it('should expose $disconnect method', () => {
    expect(service.$disconnect).toBeDefined()
    expect(typeof service.$disconnect).toBe('function')
  })

  it('should expose $on method', () => {
    expect(service.$on).toBeDefined()
    expect(typeof service.$on).toBe('function')
  })
})
