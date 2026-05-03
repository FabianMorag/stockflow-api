import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  emitPriceUpdate(ticker: string, price: number): void {
    const payload = JSON.stringify({ event: 'priceUpdate', ticker, price });
    this.server.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  }

  handleConnection(client: never): void {
    console.log(
      `[MarketGateway] Client connected: ${(client as { id?: string }).id || 'unknown'}`,
    );
  }

  handleDisconnect(client: never): void {
    console.log(
      `[MarketGateway] Client disconnected: ${(client as { id?: string }).id || 'unknown'}`,
    );
  }
}
