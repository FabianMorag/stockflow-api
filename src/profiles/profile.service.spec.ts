// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test';
process.env.PORT = '3000';

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: PrismaService;

  const mockProfile = {
    id: 'profile-1',
    email: 'test@test.com',
    username: 'testuser',
    balance: 10000,
    role: 'TRADER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPrismaService = {
    profile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of profiles', async () => {
      const profiles = [mockProfile];
      mockPrismaService.profile.findMany.mockResolvedValue(profiles);

      const result = await service.findAll();

      expect(result).toEqual(profiles);
      expect(prisma.profile.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no profiles exist', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a profile when it exists', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findOne('profile-1');

      expect(result).toEqual(mockProfile);
      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
      });
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Profile with id "nonexistent" not found',
      );
    });
  });

  describe('create', () => {
    const createDto: CreateProfileDto = {
      email: 'new@test.com',
      username: 'newuser',
    };

    it('should create and return a new profile with default balance', async () => {
      mockPrismaService.profile.create.mockResolvedValue({
        ...mockProfile,
        email: 'new@test.com',
        username: 'newuser',
      });

      const result = await service.create(createDto);

      expect(result).toEqual(
        expect.objectContaining({
          email: 'new@test.com',
          username: 'newuser',
        }),
      );
      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          email: 'new@test.com',
          username: 'newuser',
          balance: 10000,
        },
      });
    });

    it('should create with custom balance when provided', async () => {
      const dtoWithBalance: CreateProfileDto = {
        email: 'rich@test.com',
        username: 'richuser',
        balance: 50000,
      };

      mockPrismaService.profile.create.mockResolvedValue({
        ...mockProfile,
        email: 'rich@test.com',
        username: 'richuser',
        balance: 50000,
      });

      await service.create(dtoWithBalance);

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          email: 'rich@test.com',
          username: 'richuser',
          balance: 50000,
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      (prismaError as any).meta = { target: ['email'] };
      mockPrismaService.profile.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      (prismaError as any).meta = { target: ['username'] };
      mockPrismaService.profile.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateProfileDto = {
      username: 'updateduser',
    };

    it('should update and return the profile when it exists', async () => {
      const updatedProfile = { ...mockProfile, username: 'updateduser' };
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);

      const result = await service.update('profile-1', updateDto);

      expect(result).toEqual(updatedProfile);
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: updateDto,
      });
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustBalance', () => {
    it('should increase balance with positive amount', async () => {
      const profileWithBalance = { ...mockProfile, balance: 10000 };
      mockPrismaService.profile.findUnique.mockResolvedValue(
        profileWithBalance,
      );
      mockPrismaService.profile.update.mockResolvedValue({
        ...mockProfile,
        balance: 10500,
      });

      const result = await service.adjustBalance('profile-1', 500);

      expect(result.balance).toBe(10500);
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: { balance: 10500 },
      });
    });

    it('should decrease balance with negative amount', async () => {
      const profileWithBalance = { ...mockProfile, balance: 10000 };
      mockPrismaService.profile.findUnique.mockResolvedValue(
        profileWithBalance,
      );
      mockPrismaService.profile.update.mockResolvedValue({
        ...mockProfile,
        balance: 9500,
      });

      const result = await service.adjustBalance('profile-1', -500);

      expect(result.balance).toBe(9500);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.adjustBalance('nonexistent', 100)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
