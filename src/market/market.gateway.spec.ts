import { Test, TestingModule } from '@nestjs/testing';
import { MarketGateway } from './market.gateway';

describe('MarketGateway', () => {
  let gateway: MarketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketGateway],
    }).compile();

    gateway = module.get<MarketGateway>(MarketGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });
  });

  describe('emitPriceUpdate', () => {
    it('should broadcast price update to clients', () => {
      const mockClient = {
        readyState: 1,
        send: jest.fn(),
      };
      const mockServer = {
        clients: new Set([mockClient]),
      };
      gateway.server = mockServer as never;

      gateway.emitPriceUpdate('AAPL', 102.5);

      expect(mockClient.send).toHaveBeenCalledWith(
        JSON.stringify({ event: 'priceUpdate', ticker: 'AAPL', price: 102.5 }),
      );
    });
  });

  describe('handleConnection', () => {
    it('should log when a client connects', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient = { id: 'client-1' } as never;

      gateway.handleConnection(mockClient);

      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log when a client disconnects', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockClient = { id: 'client-1' } as never;

      gateway.handleDisconnect(mockClient);

      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
});
