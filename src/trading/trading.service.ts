import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stocks/stock.service';
import { ProfileService } from '../profiles/profile.service';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';
import { TradeResponseDto } from './dto/trade-response.dto';

/** Convert Prisma Decimal or plain number to JS number */
function toNumber(value: any): number {
  return typeof value === 'object' && value !== null && 'toNumber' in value
    ? value.toNumber()
    : Number(value);
}

@Injectable()
export class TradingService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private profileService: ProfileService,
  ) {}

  async buy(profileId: string, dto: BuyDto): Promise<TradeResponseDto> {
    const stock = await this.stockService.findOne(dto.stockTicker);
    const profile = await this.profileService.findOne(profileId);

    const stockPrice = toNumber(stock.currentPrice);
    const totalAmount = stockPrice * dto.quantity;
    const profileBalance = toNumber(profile.balance);

    if (profileBalance < totalAmount) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${totalAmount}, Available: ${profileBalance}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          profileId,
          stockTicker: dto.stockTicker,
          type: 'BUY',
          quantity: dto.quantity,
          priceAtExecution: stock.currentPrice,
          totalAmount,
        },
      });

      const updatedProfile = await tx.profile.update({
        where: { id: profileId },
        data: { balance: { decrement: totalAmount } },
      });

      const existingHolding = await tx.holding.findUnique({
        where: {
          profileId_stockTicker: {
            profileId,
            stockTicker: dto.stockTicker,
          },
        },
      });

      let holding;
      if (existingHolding) {
        const existingQty = toNumber(existingHolding.quantity);
        const existingAvg = toNumber(existingHolding.averagePurchasePrice);

        const newTotalQty = existingQty + dto.quantity;
        const newAvgPrice =
          (existingAvg * existingQty + stockPrice * dto.quantity) / newTotalQty;

        holding = await tx.holding.update({
          where: {
            profileId_stockTicker: {
              profileId,
              stockTicker: dto.stockTicker,
            },
          },
          data: {
            quantity: newTotalQty,
            averagePurchasePrice: newAvgPrice,
          },
        });
      } else {
        holding = await tx.holding.create({
          data: {
            profileId,
            stockTicker: dto.stockTicker,
            quantity: dto.quantity,
            averagePurchasePrice: stockPrice,
          },
        });
      }

      return { transaction, profile: updatedProfile, holding };
    });

    return {
      id: result.transaction.id,
      profileId: result.transaction.profileId,
      stockTicker: result.transaction.stockTicker,
      type: result.transaction.type,
      quantity: dto.quantity,
      priceAtExecution: stockPrice,
      totalAmount,
      timestamp: result.transaction.timestamp,
      newBalance: toNumber(result.profile.balance),
      holdingQuantity: toNumber(result.holding.quantity),
    };
  }

  async sell(profileId: string, dto: SellDto): Promise<TradeResponseDto> {
    const stock = await this.stockService.findOne(dto.stockTicker);
    const stockPrice = toNumber(stock.currentPrice);

    const result = await this.prisma.$transaction(async (tx) => {
      const existingHolding = await tx.holding.findUnique({
        where: {
          profileId_stockTicker: {
            profileId,
            stockTicker: dto.stockTicker,
          },
        },
      });

      if (!existingHolding) {
        throw new BadRequestException(
          `No holdings for stock "${dto.stockTicker}"`,
        );
      }

      const holdingQty = toNumber(existingHolding.quantity);

      if (holdingQty < dto.quantity) {
        throw new BadRequestException(
          `Insufficient holdings. Required: ${dto.quantity}, Available: ${holdingQty}`,
        );
      }

      const totalAmount = stockPrice * dto.quantity;

      const transaction = await tx.transaction.create({
        data: {
          profileId,
          stockTicker: dto.stockTicker,
          type: 'SELL',
          quantity: dto.quantity,
          priceAtExecution: stock.currentPrice,
          totalAmount,
        },
      });

      const updatedProfile = await tx.profile.update({
        where: { id: profileId },
        data: { balance: { increment: totalAmount } },
      });

      const remainingQty = holdingQty - dto.quantity;
      let holding;

      if (remainingQty <= 0) {
        await tx.holding.delete({
          where: {
            profileId_stockTicker: {
              profileId,
              stockTicker: dto.stockTicker,
            },
          },
        });
        holding = null;
      } else {
        holding = await tx.holding.update({
          where: {
            profileId_stockTicker: {
              profileId,
              stockTicker: dto.stockTicker,
            },
          },
          data: { quantity: remainingQty },
        });
      }

      return { transaction, profile: updatedProfile, holding };
    });

    return {
      id: result.transaction.id,
      profileId: result.transaction.profileId,
      stockTicker: result.transaction.stockTicker,
      type: result.transaction.type,
      quantity: dto.quantity,
      priceAtExecution: stockPrice,
      totalAmount: toNumber(result.transaction.totalAmount),
      timestamp: result.transaction.timestamp,
      newBalance: toNumber(result.profile.balance),
      holdingQuantity: result.holding ? toNumber(result.holding.quantity) : 0,
    };
  }
}
