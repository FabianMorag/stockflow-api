import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from './config/config.module'
import { PrismaModule } from './prisma/prisma.module'
import { StocksModule } from './stocks/stocks.module'
import { ProfilesModule } from './profiles/profiles.module'
import { AuthModule } from './auth/auth.module'
import { TradingModule } from './trading/trading.module'
import { PortfolioModule } from './portfolio/portfolio.module'
import { MarketModule } from './market/market.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StocksModule,
    ProfilesModule,
    AuthModule,
    TradingModule,
    PortfolioModule,
    MarketModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
