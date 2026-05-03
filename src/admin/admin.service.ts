import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '#prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { ProfileService } from '#profiles/profile.service'
import { StockService } from '#stocks/stock.service'
import { CreateTickerDto } from './dto/create-ticker.dto'
import { UpdateTickerDto } from './dto/update-ticker.dto'

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
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService,
    private stockService: StockService,
  ) {}

  async adjustBalance(profileId: string, amount: number) {
    const profile = await this.profileService.findOne(profileId)
    const currentBalance = toNumber(profile.balance)
    const newBalance = currentBalance + amount

    return this.prisma.profile.update({
      where: { id: profileId },
      data: { balance: newBalance },
    })
  }

  async createTicker(dto: CreateTickerDto) {
    try {
      return this.prisma.stock.create({
        data: {
          ticker: dto.ticker,
          name: dto.name,
          currentPrice: dto.price,
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

  async updateTicker(ticker: string, dto: UpdateTickerDto) {
    const stock = await this.prisma.stock.findUnique({
      where: { ticker },
    })

    if (!stock) {
      throw new NotFoundException(`Stock with ticker "${ticker}" not found`)
    }

    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.price !== undefined) data.currentPrice = dto.price

    return this.prisma.stock.update({
      where: { ticker },
      data,
    })
  }

  async deleteTicker(ticker: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { ticker },
    })

    if (!stock) {
      throw new NotFoundException(`Stock with ticker "${ticker}" not found`)
    }

    const holdingCount = await this.prisma.holding.count({
      where: { stockTicker: ticker },
    })

    if (holdingCount > 0) {
      throw new ConflictException('Cannot delete stock with active holdings')
    }

    return this.prisma.stock.delete({
      where: { ticker },
    })
  }
}
