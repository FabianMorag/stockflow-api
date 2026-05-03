import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { StockService } from '../stocks/stock.service'
import { ProfileService } from '../profiles/profile.service'
import { HoldingResponseDto } from './dto/holding-response.dto'
import { PortfolioSummaryDto } from './dto/portfolio-summary.dto'
import {
  TransactionHistoryItemDto,
  TransactionHistoryResponseDto,
} from './dto/transaction-history-response.dto'

/** Convert Prisma Decimal or plain number to JS number */
function toNumber(value: unknown): number {
  return typeof value === 'object' &&
    value !== null &&
    'toNumber' in (value as Record<string, unknown>)
    ? (value as { toNumber: () => number }).toNumber()
    : Number(value)
}

export interface TransactionHistoryFilters {
  page?: number
  limit?: number
  type?: 'BUY' | 'SELL'
  stockTicker?: string
}

@Injectable()
export class PortfolioService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private profileService: ProfileService,
  ) {}

  async getHoldings(profileId: string): Promise<HoldingResponseDto[]> {
    const holdings = await this.prisma.holding.findMany({
      where: { profileId },
    })

    const result: HoldingResponseDto[] = []

    for (const holding of holdings) {
      const stock = await this.stockService.findOne(holding.stockTicker)
      const quantity = toNumber(holding.quantity)
      const avgPrice = toNumber(holding.averagePurchasePrice)
      const currentPrice = toNumber(stock.currentPrice)
      const marketValue = quantity * currentPrice
      const gainLoss = marketValue - quantity * avgPrice
      const gainLossPercentage =
        quantity * avgPrice > 0
          ? Math.round((gainLoss / (quantity * avgPrice)) * 10000) / 100
          : 0

      result.push({
        stockTicker: holding.stockTicker,
        stockName: stock.name,
        quantity,
        averagePurchasePrice: avgPrice,
        currentPrice,
        marketValue,
        gainLoss,
        gainLossPercentage,
      })
    }

    return result
  }

  async getNetWorth(profileId: string): Promise<PortfolioSummaryDto> {
    const profile = await this.profileService.findOne(profileId)
    const balance = toNumber(profile.balance)

    const holdings = await this.prisma.holding.findMany({
      where: { profileId },
    })

    let holdingsValue = 0

    for (const holding of holdings) {
      const stock = await this.stockService.findOne(holding.stockTicker)
      const quantity = toNumber(holding.quantity)
      const currentPrice = toNumber(stock.currentPrice)
      holdingsValue += quantity * currentPrice
    }

    return {
      profileId,
      balance,
      holdingsValue,
      netWorth: balance + holdingsValue,
    }
  }

  async getTransactionHistory(
    profileId: string,
    filters: TransactionHistoryFilters,
  ): Promise<TransactionHistoryResponseDto> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 10
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { profileId }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.stockTicker) {
      where.stockTicker = filters.stockTicker
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ])

    const items: TransactionHistoryItemDto[] = transactions.map(t => ({
      id: t.id,
      stockTicker: t.stockTicker,
      type: t.type,
      quantity: toNumber(t.quantity),
      priceAtExecution: toNumber(t.priceAtExecution),
      totalAmount: toNumber(t.totalAmount),
      timestamp: t.timestamp,
    }))

    return {
      transactions: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
