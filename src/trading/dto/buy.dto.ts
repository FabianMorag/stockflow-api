import { IsString, IsNumber, Min } from 'class-validator';

export class BuyDto {
  @IsString()
  stockTicker!: string;

  @IsNumber()
  @Min(0.000001, { message: 'Quantity must be greater than zero' })
  quantity!: number;
}
