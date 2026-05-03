import { IsString, IsNumber } from 'class-validator';

export class CreateStockDto {
  @IsString()
  ticker!: string;

  @IsString()
  name!: string;

  @IsNumber()
  currentPrice!: number;
}
