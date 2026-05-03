import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateStockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  currentPrice?: number;
}
