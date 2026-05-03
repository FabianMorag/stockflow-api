import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

/** Check if an error is a Prisma unique constraint violation (P2002) */
function isUniqueConstraintError(
  error: unknown,
): error is { code: 'P2002'; meta: { target?: string[] } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

/** Convert Prisma Decimal or plain number to JS number */
function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber()
}

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    })

    if (!profile) {
      throw new NotFoundException(`Profile with id "${id}" not found`)
    }

    return profile
  }

  async create(dto: CreateProfileDto) {
    try {
      return await this.prisma.profile.create({
        data: {
          email: dto.email,
          username: dto.username,
          balance: dto.balance ?? 10000,
        },
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const target = error.meta?.target?.[0]
        throw new ConflictException(`${target} already exists`)
      }
      throw error
    }
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.findOne(id)

    try {
      return await this.prisma.profile.update({
        where: { id },
        data: dto,
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const target = error.meta?.target?.[0]
        throw new ConflictException(`${target} already exists`)
      }
      throw error
    }
  }

  async adjustBalance(id: string, amount: number) {
    const profile = await this.findOne(id)
    const currentBalance = toNumber(profile.balance)
    const newBalance = currentBalance + amount

    return this.prisma.profile.update({
      where: { id },
      data: { balance: newBalance },
    })
  }
}
