import { io, Socket } from 'socket.io-client';
import authService from './auth.service';
import type {
    WebSocketEventType,
    WebSocketNotification,
    SaleUpdatePayload,
    WebSocketConnectOptions,
    GoalUpdatePayload,
    UserUpdatePayload,
    SystemEventPayload,
    WebSocketConnectionStats,
} from '../types';

/**
 * Re-export types for backward compatibility
 * @deprecated Import directly from '../types' instead
 */
export type {
    WebSocketEventType,
    WebSocketNotification,
    SaleUpdatePayload,
    WebSocketConnectOptions,
};

/**
 * Servicio WebSocket para notificaciones en tiempo real
 *
 * Uso básico:
 * ```ts
 * import { websocketService } from '@/services/websocket.service';
 *
 * // Conectar
 * websocketService.connect();
 *
 * // Escuchar notificaciones
 * websocketService.on('notification', (notification) => {
 *   console.log('Nueva notificación:', notification);
 * });
 *
 * // Desconectar
 * websocketService.disconnect();
 * ```
 */
class WebSocketService {
    private socket: Socket | null = null;
    private isConnecting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 1; // Reduced to 1 to stop retrying if WebSocket is not available
    private reconnectDelay = 1000; // 1 segundo
    private listeners = new Map<WebSocketEventType, Set<(data: unknown) => void>>();
    private disabled = false; // Flag to disable WebSocket if not available

    private get API_URL(): string {
        return import.meta.env.VITE_API_URL || 'https://backend-production-6ce5a.up.railway.app';
    }

    /**
     * Check if WebSocket is enabled
     */
    isEnabled(): boolean {
        return !this.disabled;
    }

    /**
     * Conecta al servidor WebSocket
     */
    connect(options: WebSocketConnectOptions = {}): Promise<Socket> {
        const { userId, token, autoConnect = true } = options;

        // Si WebSocket está deshabilitado, rechazar inmediatamente
        if (this.disabled) {
            return Promise.reject(new Error('WebSocket is disabled'));
        }

        // Si ya está conectado, retornar el socket existente
        if (this.socket?.connected) {
            return Promise.resolve(this.socket);
        }

        // Si ya está intentando conectar, esperar
        if (this.isConnecting) {
            return new Promise((resolve) => {
                const checkConnection = setInterval(() => {
                    if (this.socket?.connected) {
                        clearInterval(checkConnection);
                        resolve(this.socket);
                    }
                }, 100);
            });
        }

        this.isConnecting = true;

        const currentUser = authService.getCurrentUser();
        const connectUserId = userId || currentUser?.id;
        const connectToken = token || localStorage.getItem('accessToken');

        if (!connectUserId) {
            console.error('[WebSocket] No userId provided for connection');
            this.isConnecting = false;
            return Promise.reject(new Error('userId is required'));
        }

        return new Promise((resolve, reject) => {
            try {
                this.socket = io(this.API_URL, {
                    path: '/socket.io/',
                    query: { userId: connectUserId },
                    auth: { token: connectToken },
                    transports: ['websocket', 'polling'],
                    autoConnect,
                    reconnection: false, // Disable built-in reconnection - handle it ourselves
                });

                this.setupEventHandlers();

                this.socket.on('connect', () => {
                    console.log('[WebSocket] Connected:', this.socket?.id);
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.disabled = false; // Re-enable on successful connection
                    resolve(this.socket!);
                });

                this.socket.on('connect_error', (error) => {
                    console.warn('[WebSocket] Connection error - real-time features unavailable');
                    this.isConnecting = false;
                    this.reconnectAttempts++;

                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        // Disable WebSocket after max attempts to stop retrying
                        this.disabled = true;
                        console.warn('[WebSocket] Real-time features disabled - server does not support WebSocket');
                        reject(error);
                    }
                });
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Desconecta del servidor WebSocket
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('[WebSocket] Disconnected');
        }
    }

    /**
     * Verifica si está conectado
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Registra un listener para un evento específico
     */
    on(eventType: WebSocketEventType, callback: (data: unknown) => void): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(callback);

        // Si el socket está conectado, agregar el listener directamente
        if (this.socket?.connected) {
            this.socket.on(eventType, callback);
        }
    }

    /**
     * Elimina un listener de un evento específico
     */
    off(eventType: WebSocketEventType, callback: (data: unknown) => void): void {
        const eventListeners = this.listeners.get(eventType);
        if (eventListeners) {
            eventListeners.delete(callback);
            if (eventListeners.size === 0) {
                this.listeners.delete(eventType);
            }
        }

        if (this.socket?.connected) {
            this.socket.off(eventType, callback);
        }
    }

    /**
     * Elimina todos los listeners de un evento
     */
    removeAllListeners(eventType?: WebSocketEventType): void {
        if (eventType) {
            const listeners = this.listeners.get(eventType);
            if (listeners) {
                listeners.forEach((callback) => {
                    this.socket?.off(eventType, callback);
                });
                this.listeners.delete(eventType);
            }
        } else {
            this.listeners.forEach((listeners, evt) => {
                listeners.forEach((callback) => {
                    this.socket?.off(evt, callback);
                });
            });
            this.listeners.clear();
        }
    }

    /**
     * Se une a una sala específica
     */
    joinRoom(room: string): void {
        if (this.socket?.connected) {
            this.socket.emit('join-room', { room });
            console.log(`[WebSocket] Joining room: ${room}`);
        } else {
            console.warn('[WebSocket] Cannot join room: not connected');
        }
    }

    /**
     * Sale de una sala específica
     */
    leaveRoom(room: string): void {
        if (this.socket?.connected) {
            this.socket.emit('leave-room', { room });
            console.log(`[WebSocket] Leaving room: ${room}`);
        }
    }

    /**
     * Obtiene estadísticas de conexión
     */
    getStats(): void {
        if (this.socket?.connected) {
            this.socket.emit('get-stats');
        }
    }

    /**
     * Configura los event handlers por defecto
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        // Notificaciones
        this.socket.on('notification', (data: WebSocketNotification) => {
            this.emitToListeners('notification', data);
        });

        this.socket.on('notification_read', (data: unknown) => {
            this.emitToListeners('notification_read', data);
        });

        this.socket.on('notification_deleted', (data: unknown) => {
            this.emitToListeners('notification_deleted', data);
        });

        this.socket.on('all_notifications_read', (data: unknown) => {
            this.emitToListeners('all_notifications_read', data);
        });

        // Eventos de sistema
        this.socket.on('sale_update', (data: SaleUpdatePayload) => {
            this.emitToListeners('sale_update', data);
        });

        this.socket.on('goal_update', (data: GoalUpdatePayload) => {
            this.emitToListeners('goal_update', data);
        });

        this.socket.on('user_update', (data: UserUpdatePayload) => {
            this.emitToListeners('user_update', data);
        });

        this.socket.on('system_event', (data: SystemEventPayload) => {
            this.emitToListeners('system_event', data);
        });

        // Eventos de conexión
        this.socket.on('connected', (data: unknown) => {
            console.log('[WebSocket] Server confirmed connection:', data);
            this.emitToListeners('connected', data);
        });

        this.socket.on('room-joined', (data: unknown) => {
            console.log('[WebSocket] Room joined:', data);
            this.emitToListeners('room-joined', data);
        });

        this.socket.on('room-left', (data: unknown) => {
            console.log('[WebSocket] Room left:', data);
            this.emitToListeners('room-left', data);
        });

        this.socket.on('stats', (data: WebSocketConnectionStats) => {
            this.emitToListeners('stats', data);
        });

        this.socket.on('error', (data: unknown) => {
            console.error('[WebSocket] Error:', data);
            this.emitToListeners('error', data);
        });
    }

    /**
     * Emite un evento a todos los listeners registrados
     */
    private emitToListeners(eventType: WebSocketEventType, data: unknown): void {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[WebSocket] Error in listener for ${eventType}:`, error);
                }
            });
        }
    }
}

// Exportar instancia única
export const websocketService = new WebSocketService();

// Auto-conectar cuando el usuario esté autenticado
if (authService.isAuthenticated()) {
    websocketService.connect().catch((error) => {
        console.error('[WebSocket] Auto-connect failed:', error);
    });
}

export default websocketService;
