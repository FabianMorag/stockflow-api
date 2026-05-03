import { Module } from '@nestjs/common'
import { TradingService } from './trading.service'
import { TradeController } from './trade.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { StocksModule } from '../stocks/stocks.module'
import { ProfilesModule } from '../profiles/profiles.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, StocksModule, ProfilesModule, AuthModule],
  controllers: [TradeController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}
