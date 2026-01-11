import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*', // Ajustar según producción
    },
    transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private connectedUsers = new Map<string, string>(); // socketId -> userId

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized successfully');
    }

    async handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.connectedUsers.set(client.id, userId);
            client.join(`user:${userId}`);
            console.log(`[WebSocket] User ${userId} connected with socket ${client.id}`);

            // Enviar confirmación de conexión
            client.emit('connected', {
                message: 'Conectado al servidor de notificaciones',
                socketId: client.id,
                userId,
            });
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = this.connectedUsers.get(client.id);
        if (userId) {
            this.connectedUsers.delete(client.id);
            client.leave(`user:${userId}`);
            console.log(`[WebSocket] User ${userId} disconnected`);
        }
    }

    @SubscribeMessage('join-room')
    handleJoinRoom(
        @MessageBody() data: { room: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(data.room);
        console.log(`[WebSocket] Socket ${client.id} joined room: ${data.room}`);
        client.emit('room-joined', { room: data.room });
        return { event: 'room-joined', data: { room: data.room } };
    }

    @SubscribeMessage('leave-room')
    handleLeaveRoom(
        @MessageBody() data: { room: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(data.room);
        console.log(`[WebSocket] Socket ${client.id} left room: ${data.room}`);
        client.emit('room-left', { room: data.room });
        return { event: 'room-left', data: { room: data.room } };
    }

    @SubscribeMessage('get-stats')
    handleGetStats(@ConnectedSocket() client: Socket) {
        const userId = this.connectedUsers.get(client.id);
        const rooms = Array.from(client.rooms).filter((room) => room !== client.id);
        client.emit('stats', {
            connected: true,
            rooms,
            userId,
            connectedUsers: this.connectedUsers.size,
        });
    }

    // Métodos para enviar notificaciones desde otros servicios
    sendNotificationToUser(userId: string, notification: any) {
        this.server.to(`user:${userId}`).emit('notification', notification);
    }

    sendNotificationToAll(notification: any) {
        this.server.emit('notification', notification);
    }

    sendSaleUpdate(sale: any) {
        this.server.emit('sale_update', {
            event: 'sale_update',
            action: 'updated',
            data: sale,
            timestamp: new Date(),
        });
    }

    sendGoalUpdate(goal: any) {
        this.server.emit('goal_update', {
            event: 'goal_update',
            action: 'updated',
            data: goal,
            timestamp: new Date(),
        });
    }

    sendUserUpdate(user: any) {
        this.server.emit('user_update', {
            event: 'user_update',
            action: 'updated',
            data: user,
            timestamp: new Date(),
        });
    }
}
