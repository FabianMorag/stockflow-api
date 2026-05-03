export class TransactionHistoryItemDto {
  id!: string;
  stockTicker!: string;
  type!: 'BUY' | 'SELL';
  quantity!: number;
  priceAtExecution!: number;
  totalAmount!: number;
  timestamp!: Date;
}

export class TransactionHistoryResponseDto {
  transactions!: TransactionHistoryItemDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
