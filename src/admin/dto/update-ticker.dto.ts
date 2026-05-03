import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateTickerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}
