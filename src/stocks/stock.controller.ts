import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { StockService } from './stock.service'
import { CreateStockDto } from './dto/create-stock.dto'
import { UpdateStockDto } from './dto/update-stock.dto'

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll() {
    return this.stockService.findAll()
  }

  @Get(':ticker')
  findOne(@Param('ticker') ticker: string) {
    return this.stockService.findOne(ticker)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStockDto: CreateStockDto) {
    return this.stockService.create(createStockDto)
  }

  @Patch(':ticker')
  update(
    @Param('ticker') ticker: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.stockService.update(ticker, updateStockDto)
  }

  @Delete(':ticker')
  remove(@Param('ticker') ticker: string) {
    return this.stockService.remove(ticker)
  }
}
