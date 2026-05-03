import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { CreateTickerDto } from './dto/create-ticker.dto';
import { UpdateTickerDto } from './dto/update-ticker.dto';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('profiles/:id/adjust-balance')
  @HttpCode(HttpStatus.OK)
  adjustBalance(@Param('id') profileId: string, @Body() dto: AdjustBalanceDto) {
    return this.adminService.adjustBalance(profileId, dto.amount);
  }

  @Post('tickers')
  @HttpCode(HttpStatus.CREATED)
  createTicker(@Body() dto: CreateTickerDto) {
    return this.adminService.createTicker(dto);
  }

  @Patch('tickers/:ticker')
  updateTicker(@Param('ticker') ticker: string, @Body() dto: UpdateTickerDto) {
    return this.adminService.updateTicker(ticker, dto);
  }

  @Delete('tickers/:ticker')
  deleteTicker(@Param('ticker') ticker: string) {
    return this.adminService.deleteTicker(ticker);
  }
}
