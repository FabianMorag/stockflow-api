// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

// Mock PrismaClient (ESM module with import.meta) — required for transitive imports
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

describe('ProfileController', () => {
  let controller: ProfileController

  const mockProfile = {
    id: 'profile-1',
    email: 'test@test.com',
    username: 'testuser',
    balance: 10000,
    role: 'TRADER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockProfileService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    adjustBalance: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: mockProfileService }],
    }).compile()

    controller = module.get<ProfileController>(ProfileController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return all profiles', async () => {
      const profiles = [mockProfile]
      mockProfileService.findAll.mockResolvedValue(profiles)

      const result = await controller.findAll()

      expect(result).toEqual(profiles)
      expect(mockProfileService.findAll).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      mockProfileService.findOne.mockResolvedValue(mockProfile)

      const result = await controller.findOne('profile-1')

      expect(result).toEqual(mockProfile)
      expect(mockProfileService.findOne).toHaveBeenCalledWith('profile-1')
    })

    it('should propagate NotFoundException from service', async () => {
      mockProfileService.findOne.mockRejectedValue(
        new NotFoundException('Profile with id "xyz" not found'),
      )

      await expect(controller.findOne('xyz')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    const createDto: CreateProfileDto = {
      email: 'new@test.com',
      username: 'newuser',
    }

    it('should create a new profile and return 201', async () => {
      mockProfileService.create.mockResolvedValue(mockProfile)

      const result = await controller.create(createDto)

      expect(result).toEqual(mockProfile)
      expect(mockProfileService.create).toHaveBeenCalledWith(createDto)
    })
  })

  describe('update', () => {
    const updateDto: UpdateProfileDto = {
      username: 'updateduser',
    }

    it('should update a profile and return it', async () => {
      const updatedProfile = { ...mockProfile, username: 'updateduser' }
      mockProfileService.update.mockResolvedValue(updatedProfile)

      const result = await controller.update('profile-1', updateDto)

      expect(result).toEqual(updatedProfile)
      expect(mockProfileService.update).toHaveBeenCalledWith(
        'profile-1',
        updateDto,
      )
    })

    it('should propagate NotFoundException from service', async () => {
      mockProfileService.update.mockRejectedValue(
        new NotFoundException('Profile with id "xyz" not found'),
      )

      await expect(controller.update('xyz', updateDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
