import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStockDto } from './dto/create-stock.dto'
import { UpdateStockDto } from './dto/update-stock.dto'

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.stock.findMany({
      orderBy: { ticker: 'asc' },
    })
  }

  async findOne(ticker: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { ticker },
    })

    if (!stock) {
      throw new NotFoundException(`Stock with ticker "${ticker}" not found`)
    }

    return stock
  }

  async create(dto: CreateStockDto) {
    return this.prisma.stock.create({
      data: {
        ticker: dto.ticker,
        name: dto.name,
        currentPrice: dto.currentPrice,
      },
    })
  }

  async update(ticker: string, dto: UpdateStockDto) {
    await this.findOne(ticker)

    return this.prisma.stock.update({
      where: { ticker },
      data: dto,
    })
  }

  async remove(ticker: string) {
    await this.findOne(ticker)

    return this.prisma.stock.delete({
      where: { ticker },
    })
  }
}
