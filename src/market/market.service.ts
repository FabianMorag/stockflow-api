import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stocks/stock.service';

@Injectable()
export class MarketService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  /**
   * Generates a random price fluctuation within ±5% of the original price.
   */
  simulatePriceChange(currentPrice: number): number {
    const fluctuation = (Math.random() * 0.1 - 0.05) * currentPrice;
    const newPrice = currentPrice + fluctuation;
    return Math.max(0.01, Number(newPrice.toFixed(2)));
  }

  /**
   * Iterates all stocks, simulates new prices, updates DB, and records snapshots.
   */
  async updateAllStockPrices() {
    const stocks = await this.stockService.findAll();
    const updated: Array<{ ticker: string; newPrice: number }> = [];

    for (const stock of stocks) {
      const currentPrice = Number(stock.currentPrice);
      const newPrice = this.simulatePriceChange(currentPrice);

      await this.stockService.update(stock.ticker, { currentPrice: newPrice });
      await this.recordPriceSnapshot(stock.ticker, newPrice);

      updated.push({ ticker: stock.ticker, newPrice });
    }

    return updated;
  }

  /**
   * Creates a PriceSnapshot record for a given ticker and price.
   */
  recordPriceSnapshot(ticker: string, price: number) {
    return this.prisma.priceSnapshot.create({
      data: {
        stockTicker: ticker,
        price,
      },
    });
  }
}
