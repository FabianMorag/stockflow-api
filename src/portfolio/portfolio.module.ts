import { Module } from '@nestjs/common'
import { PortfolioController } from './portfolio.controller'
import { PortfolioService } from './portfolio.service'
import { PrismaModule } from '#prisma/prisma.module'
import { StocksModule } from '#stocks/stocks.module'
import { ProfilesModule } from '#profiles/profiles.module'
import { AuthModule } from '#auth/auth.module'

@Module({
  imports: [PrismaModule, StocksModule, ProfilesModule, AuthModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
