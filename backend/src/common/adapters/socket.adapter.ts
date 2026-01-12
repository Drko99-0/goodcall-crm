import { ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';
import { INestApplicationContext } from '@nestjs/common';
import { Server } from 'socket.io';
import { createServer } from 'http';

export class SocketAdapter extends IoAdapter {
  private readonly logger = new Logger('SocketAdapter');
  private httpServer: any;

  constructor(app: INestApplicationContext) {
    super(app);
    // Get the existing HTTP server from NestJS application
    this.httpServer = app.getHttpServer();
    this.logger.log(`SocketAdapter initialized with HTTP server`);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    // Ignore the port parameter and attach to the existing HTTP server
    const server = new Server(this.httpServer, {
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
