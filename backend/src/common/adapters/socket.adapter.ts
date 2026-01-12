import { ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Server } from 'socket.io';

export class SocketAdapter extends IoAdapter {
  private readonly logger = new Logger('SocketAdapter');

  constructor(app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const httpServer = this.httpServer;

    const server = new Server(httpServer, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
    });

    this.logger.log(`Socket.IO server attached to HTTP server`);
    return server;
  }
}
