import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { PortfolioService } from './portfolio.service'
import { MockJwtAuthGuard } from '#auth/guards/mock-jwt-auth.guard'
import { CurrentUser } from '#auth/decorators/current-user.decorator'
import type { JwtUserPayload } from '#auth/decorators/current-user.decorator'

@Controller('portfolio')
@UseGuards(MockJwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('holdings')
  async getHoldings(@CurrentUser() user: JwtUserPayload) {
    return this.portfolioService.getHoldings(user.sub)
  }

  @Get('net-worth')
  async getNetWorth(@CurrentUser() user: JwtUserPayload) {
    return this.portfolioService.getNetWorth(user.sub)
  }

  @Get('history')
  async getTransactionHistory(
    @CurrentUser() user: JwtUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'BUY' | 'SELL',
    @Query('stockTicker') stockTicker?: string,
  ) {
    return this.portfolioService.getTransactionHistory(user.sub, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      type,
      stockTicker,
    })
  }
}
