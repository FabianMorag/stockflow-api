import { IsNumber } from 'class-validator'

export class AdjustBalanceDto {
  @IsNumber()
  amount!: number
}
