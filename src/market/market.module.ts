import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { MarketService } from './market.service'
import { MarketCronService } from './market-cron.service'
import { MarketGateway } from './market.gateway'
import { PrismaModule } from '#prisma/prisma.module'
import { StocksModule } from '#stocks/stocks.module'

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, StocksModule],
  providers: [MarketService, MarketCronService, MarketGateway],
  exports: [MarketService, MarketGateway],
})
export class MarketModule {}
