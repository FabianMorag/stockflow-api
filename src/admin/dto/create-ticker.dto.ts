import { IsString, IsNumber } from 'class-validator';

export class CreateTickerDto {
  @IsString()
  ticker!: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;
}
