import { AdjustBalanceDto } from './adjust-balance.dto';
import { CreateTickerDto } from './create-ticker.dto';
import { UpdateTickerDto } from './update-ticker.dto';

describe('AdjustBalanceDto', () => {
  it('should be defined', () => {
    expect(AdjustBalanceDto).toBeDefined();
  });

  it('should have amount property decorated with IsNumber', () => {
    const dto = new AdjustBalanceDto();
    dto.amount = 500;
    expect(dto.amount).toBe(500);
  });

  it('should accept negative amounts for deductions', () => {
    const dto = new AdjustBalanceDto();
    dto.amount = -1000;
    expect(dto.amount).toBe(-1000);
  });
});

describe('CreateTickerDto', () => {
  it('should be defined', () => {
    expect(CreateTickerDto).toBeDefined();
  });

  it('should have required properties', () => {
    const dto = new CreateTickerDto();
    dto.ticker = 'AAPL';
    dto.name = 'Apple Inc.';
    dto.price = 150.0;

    expect(dto.ticker).toBe('AAPL');
    expect(dto.name).toBe('Apple Inc.');
    expect(dto.price).toBe(150.0);
  });
});

describe('UpdateTickerDto', () => {
  it('should be defined', () => {
    expect(UpdateTickerDto).toBeDefined();
  });

  it('should allow partial updates', () => {
    const dto = new UpdateTickerDto();
    dto.name = 'Updated Name';

    expect(dto.name).toBe('Updated Name');
    expect(dto.price).toBeUndefined();
  });

  it('should allow price-only updates', () => {
    const dto = new UpdateTickerDto();
    dto.price = 200.0;

    expect(dto.price).toBe(200.0);
    expect(dto.name).toBeUndefined();
  });
});
