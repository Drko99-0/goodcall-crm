import { ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';

export class SocketAdapter extends IoAdapter {
  private readonly logger = new Logger('SocketAdapter');

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.logger.log(`Socket.IO server created on port: ${port}`);
    return server;
  }
}
