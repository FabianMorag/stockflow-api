import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { MarketService } from './market.service'
import { MarketGateway } from './market.gateway'

@Injectable()
export class MarketCronService {
  private readonly logger = new Logger(MarketCronService.name)

  constructor(
    private marketService: MarketService,
    private marketGateway: MarketGateway,
  ) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    this.logger.debug('Executing market price update cron job')

    const updated = await this.marketService.updateAllStockPrices()

    for (const { ticker, newPrice } of updated) {
      this.marketGateway.emitPriceUpdate(ticker, newPrice)
    }

    console.log(
      `[MarketCron] Updated ${updated.length} stock(s) at ${new Date().toISOString()}`,
    )
  }
}
