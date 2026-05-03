import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

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

describe('StockService', () => {
  let service: StockService;
  let prisma: PrismaService;

  const mockStock = {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 150.0,
    lastUpdated: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  };

  const mockPrismaService = {
    stock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of stocks', async () => {
      const stocks = [mockStock];
      mockPrismaService.stock.findMany.mockResolvedValue(stocks);

      const result = await service.findAll();

      expect(result).toEqual(stocks);
      expect(prisma.stock.findMany).toHaveBeenCalledWith({
        orderBy: { ticker: 'asc' },
      });
    });

    it('should return empty array when no stocks exist', async () => {
      mockPrismaService.stock.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a stock when it exists', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(mockStock);

      const result = await service.findOne('AAPL');

      expect(result).toEqual(mockStock);
      expect(prisma.stock.findUnique).toHaveBeenCalledWith({
        where: { ticker: 'AAPL' },
      });
    });

    it('should throw NotFoundException when stock does not exist', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(null);

      await expect(service.findOne('XYZ')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('XYZ')).rejects.toThrow(
        'Stock with ticker "XYZ" not found',
      );
    });
  });

  describe('create', () => {
    const createDto: CreateStockDto = {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      currentPrice: 150.0,
    };

    it('should create and return a new stock', async () => {
      mockPrismaService.stock.create.mockResolvedValue(mockStock);

      const result = await service.create(createDto);

      expect(result).toEqual(mockStock);
      expect(prisma.stock.create).toHaveBeenCalledWith({
        data: {
          ticker: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 150.0,
        },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateStockDto = {
      currentPrice: 160.0,
    };

    it('should update and return the stock when it exists', async () => {
      const updatedStock = { ...mockStock, currentPrice: 160.0 };
      mockPrismaService.stock.findUnique.mockResolvedValue(mockStock);
      mockPrismaService.stock.update.mockResolvedValue(updatedStock);

      const result = await service.update('AAPL', updateDto);

      expect(result).toEqual(updatedStock);
      expect(prisma.stock.update).toHaveBeenCalledWith({
        where: { ticker: 'AAPL' },
        data: updateDto,
      });
    });

    it('should throw NotFoundException when stock does not exist', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(null);

      await expect(service.update('XYZ', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the stock when it exists', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(mockStock);
      mockPrismaService.stock.delete.mockResolvedValue(mockStock);

      const result = await service.remove('AAPL');

      expect(result).toEqual(mockStock);
      expect(prisma.stock.delete).toHaveBeenCalledWith({
        where: { ticker: 'AAPL' },
      });
    });

    it('should throw NotFoundException when stock does not exist', async () => {
      mockPrismaService.stock.findUnique.mockResolvedValue(null);

      await expect(service.remove('XYZ')).rejects.toThrow(NotFoundException);
    });
  });
});
