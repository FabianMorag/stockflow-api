import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TradingService } from './trading.service';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';
import { MockJwtAuthGuard } from '../auth/guards/mock-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('trades')
@UseGuards(MockJwtAuthGuard)
export class TradeController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  async buy(@CurrentUser() user: JwtUserPayload, @Body() buyDto: BuyDto) {
    return this.tradingService.buy(user.sub, buyDto);
  }

  @Post('sell')
  @HttpCode(HttpStatus.OK)
  async sell(@CurrentUser() user: JwtUserPayload, @Body() sellDto: SellDto) {
    return this.tradingService.sell(user.sub, sellDto);
  }
}
