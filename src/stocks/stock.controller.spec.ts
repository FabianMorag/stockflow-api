import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

// Mock PrismaClient (ESM module with import.meta) — required for transitive imports
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      constructor() {}
      $connect = jest.fn().mockResolvedValue(undefined);
      $disconnect = jest.fn().mockResolvedValue(undefined);
      $on = jest.fn();
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

describe('StockController', () => {
  let controller: StockController;

  const mockStock = {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 150.0,
    lastUpdated: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  };

  const mockStockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: mockStockService }],
    }).compile();

    controller = module.get<StockController>(StockController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all stocks', async () => {
      const stocks = [mockStock];
      mockStockService.findAll.mockResolvedValue(stocks);

      const result = await controller.findAll();

      expect(result).toEqual(stocks);
      expect(mockStockService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a stock by ticker', async () => {
      mockStockService.findOne.mockResolvedValue(mockStock);

      const result = await controller.findOne('AAPL');

      expect(result).toEqual(mockStock);
      expect(mockStockService.findOne).toHaveBeenCalledWith('AAPL');
    });

    it('should propagate NotFoundException from service', async () => {
      mockStockService.findOne.mockRejectedValue(
        new NotFoundException('Stock with ticker "XYZ" not found'),
      );

      await expect(controller.findOne('XYZ')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto: CreateStockDto = {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      currentPrice: 150.0,
    };

    it('should create a new stock and return 201', async () => {
      mockStockService.create.mockResolvedValue(mockStock);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockStock);
      expect(mockStockService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    const updateDto: UpdateStockDto = {
      currentPrice: 160.0,
    };

    it('should update a stock and return it', async () => {
      const updatedStock = { ...mockStock, currentPrice: 160.0 };
      mockStockService.update.mockResolvedValue(updatedStock);

      const result = await controller.update('AAPL', updateDto);

      expect(result).toEqual(updatedStock);
      expect(mockStockService.update).toHaveBeenCalledWith('AAPL', updateDto);
    });

    it('should propagate NotFoundException from service', async () => {
      mockStockService.update.mockRejectedValue(
        new NotFoundException('Stock with ticker "XYZ" not found'),
      );

      await expect(controller.update('XYZ', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a stock and return it', async () => {
      mockStockService.remove.mockResolvedValue(mockStock);

      const result = await controller.remove('AAPL');

      expect(result).toEqual(mockStock);
      expect(mockStockService.remove).toHaveBeenCalledWith('AAPL');
    });

    it('should propagate NotFoundException from service', async () => {
      mockStockService.remove.mockRejectedValue(
        new NotFoundException('Stock with ticker "XYZ" not found'),
      );

      await expect(controller.remove('XYZ')).rejects.toThrow(NotFoundException);
    });
  });
});
