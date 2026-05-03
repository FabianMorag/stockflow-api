export class TradeResponseDto {
  id!: string
  profileId!: string
  stockTicker!: string
  type!: 'BUY' | 'SELL'
  quantity!: number
  priceAtExecution!: number
  totalAmount!: number
  timestamp!: Date
  newBalance!: number
  holdingQuantity!: number
}
