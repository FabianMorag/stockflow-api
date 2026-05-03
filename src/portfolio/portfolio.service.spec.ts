// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test';
process.env.PORT = '3000';

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stocks/stock.service';
import { ProfileService } from '../profiles/profile.service';

// Mock PrismaClient (ESM module with import.meta)
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      constructor() {}
      $connect = jest.fn().mockResolvedValue(undefined);
      $disconnect = jest.fn().mockResolvedValue(undefined);
      $on = jest.fn();
    },
    Decimal: class MockDecimal {
      constructor(private value: string | number) {}
      toNumber() {
        return Number(this.value);
      }
      toString() {
        return String(this.value);
      }
      valueOf() {
        return Number(this.value);
      }
    },
  };
});

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class MockPrismaPg {
    constructor() {}
  },
}));

jest.mock('pg', () => ({
  Pool: class MockPool {
    end = jest.fn().mockResolvedValue(undefined);
  },
}));

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockProfileId = 'profile-1';

  const mockProfile = {
    id: mockProfileId,
    email: 'test@test.com',
    username: 'testuser',
    balance: 10000,
    role: 'TRADER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockHoldings = [
    {
      id: 'holding-1',
      profileId: mockProfileId,
      stockTicker: 'AAPL',
      quantity: 10,
      averagePurchasePrice: 140.0,
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'holding-2',
      profileId: mockProfileId,
      stockTicker: 'GOOGL',
      quantity: 5,
      averagePurchasePrice: 120.0,
      updatedAt: new Date('2024-01-01'),
    },
  ];

  const mockStocks = [
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      currentPrice: 150.0,
      lastUpdated: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
    },
    {
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      currentPrice: 130.0,
      lastUpdated: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
    },
  ];

  const mockTransactions = [
    {
      id: 'txn-1',
      profileId: mockProfileId,
      stockTicker: 'AAPL',
      type: 'BUY',
      quantity: 10,
      priceAtExecution: 140.0,
      totalAmount: 1400.0,
      timestamp: new Date('2024-01-01'),
    },
    {
      id: 'txn-2',
      profileId: mockProfileId,
      stockTicker: 'GOOGL',
      type: 'BUY',
      quantity: 5,
      priceAtExecution: 120.0,
      totalAmount: 600.0,
      timestamp: new Date('2024-01-02'),
    },
  ];

  const mockPrismaService = {
    holding: {
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
  };

  const mockStockService = {
    findOne: jest.fn(),
  };

  const mockProfileService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StockService, useValue: mockStockService },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHoldings', () => {
    it('should return all holdings for a profile with stock info', async () => {
      mockPrismaService.holding.findMany.mockResolvedValue(mockHoldings);
      mockStockService.findOne
        .mockResolvedValueOnce(mockStocks[0])
        .mockResolvedValueOnce(mockStocks[1]);

      const result = await service.getHoldings(mockProfileId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        stockTicker: 'AAPL',
        stockName: 'Apple Inc.',
        quantity: 10,
        averagePurchasePrice: 140.0,
        currentPrice: 150.0,
        marketValue: 1500.0,
        gainLoss: 100.0,
        gainLossPercentage: 7.14,
      });
      expect(result[1]).toEqual({
        stockTicker: 'GOOGL',
        stockName: 'Alphabet Inc.',
        quantity: 5,
        averagePurchasePrice: 120.0,
        currentPrice: 130.0,
        marketValue: 650.0,
        gainLoss: 50.0,
        gainLossPercentage: 8.33,
      });
    });

    it('should return empty array when profile has no holdings', async () => {
      mockPrismaService.holding.findMany.mockResolvedValue([]);

      const result = await service.getHoldings(mockProfileId);

      expect(result).toEqual([]);
      expect(mockPrismaService.holding.findMany).toHaveBeenCalledWith({
        where: { profileId: mockProfileId },
      });
    });
  });

  describe('getNetWorth', () => {
    it('should calculate balance + sum(holding.quantity * stock.currentPrice)', async () => {
      mockProfileService.findOne.mockResolvedValue(mockProfile);
      mockPrismaService.holding.findMany.mockResolvedValue(mockHoldings);
      mockStockService.findOne
        .mockResolvedValueOnce(mockStocks[0])
        .mockResolvedValueOnce(mockStocks[1]);

      const result = await service.getNetWorth(mockProfileId);

      // balance: 10000 + (10 * 150) + (5 * 130) = 10000 + 1500 + 650 = 12150
      expect(result).toEqual({
        profileId: mockProfileId,
        balance: 10000,
        holdingsValue: 2150.0,
        netWorth: 12150.0,
      });
    });

    it('should return only balance when profile has no holdings', async () => {
      mockProfileService.findOne.mockResolvedValue(mockProfile);
      mockPrismaService.holding.findMany.mockResolvedValue([]);

      const result = await service.getNetWorth(mockProfileId);

      expect(result).toEqual({
        profileId: mockProfileId,
        balance: 10000,
        holdingsValue: 0,
        netWorth: 10000,
      });
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockProfileService.findOne.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(service.getNetWorth('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions,
      );
      mockPrismaService.transaction.count.mockResolvedValue(2);

      const result = await service.getTransactionHistory(mockProfileId, {
        page: 1,
        limit: 10,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should calculate correct totalPages', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue(
        mockTransactions.slice(0, 1),
      );
      mockPrismaService.transaction.count.mockResolvedValue(5);

      const result = await service.getTransactionHistory(mockProfileId, {
        page: 1,
        limit: 2,
      });

      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should apply skip correctly for pagination', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.count.mockResolvedValue(0);

      await service.getTransactionHistory(mockProfileId, {
        page: 2,
        limit: 10,
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should filter by type when provided', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.count.mockResolvedValue(0);

      await service.getTransactionHistory(mockProfileId, {
        page: 1,
        limit: 10,
        type: 'BUY',
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'BUY',
          }),
        }),
      );
    });

    it('should filter by stockTicker when provided', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.count.mockResolvedValue(0);

      await service.getTransactionHistory(mockProfileId, {
        page: 1,
        limit: 10,
        stockTicker: 'AAPL',
      });

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stockTicker: 'AAPL',
          }),
        }),
      );
    });
  });
});
