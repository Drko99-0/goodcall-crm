# Fix WebSocket - GoodCall CRM

## Fecha de Creación: 2025-01-11

## Problema Actual

### Síntoma
Error al conectar WebSocket desde el frontend:
```
WebSocket connection to 'wss://backend-production-...up.railway.app/socket.io/?...' failed
Error: Invalid namespace
```

### Comportamiento Observado
- El Gateway de NestJS se registra correctamente (los message handlers aparecen en los logs)
- El método `afterInit()` NUNCA se ejecuta (no aparece el log de inicialización)
- El servidor Socket.IO nunca se inicializa
- El frontend intenta conectar pero falla con "Invalid namespace"

## Análisis de la Situación

### Configuración Actual (CORRECTA)

**Backend** - `backend/src/modules/gateways/notifications.gateway.ts`:
```typescript
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized successfully');
        // ESTE LOG NUNCA APARECE
    }
    // ...
}
```

**Frontend** - `frontend/src/services/websocket.service.ts`:
```typescript
this.socket = io(this.API_URL, {
    query: { userId: connectUserId },
    auth: { token: connectToken },
    transports: ['websocket', 'polling'],
    autoConnect,
    reconnection: false,
});
```

### ¿Por qué la configuración actual es CORRECTA?

Según la documentación oficial:

1. **NestJS Default Behavior**: "In general, each gateway is listening on the **same port as the HTTP server**" - este es el comportamiento POR DEFECTO y RECOMENDADO.

2. **Railway Compatibility**: Railway solo permite un puerto expuesto por servicio, y su documentación confirma que WebSocket debe compartir el mismo puerto que HTTP.

3. **Producción**: Este patrón es utilizado por plataformas importantes y es considerado production-ready.

### El Misterio

A pesar de que la configuración es correcta:
- El Gateway se carga (se ve en los logs)
- Pero el servidor Socket.IO NUNCA se inicializa
- El hook `afterInit()` nunca se ejecuta

Esto sugiere que el adaptador Socket.IO no se está adjuntando correctamente al servidor HTTP de NestJS en el entorno de Railway.

## Solución Propuesta

### Crear un IoAdapter Personalizado

La solución es crear un adaptador personalizado que adjunte explícitamente el servidor Socket.IO al servidor HTTP de NestJS. Esto nos da más control y visibilidad sobre el proceso de inicialización.

### Pasos de Implementación

#### Paso 1: Crear el adaptador personalizado

**Archivo**: `backend/src/common/adapters/socket.adapter.ts` (NUEVO)

```typescript
import { ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class SocketAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: '*', // Ajustar según producción
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });

        console.log('[SocketAdapter] Socket.IO server created on port:', port);
        return server;
    }
}
```

#### Paso 2: Registrar el adaptador en main.ts

**Archivo**: `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SocketAdapter } from './common/adapters/socket.adapter'; // IMPORTAR

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Configurar validación global
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
    }));

    // Configurar CORS
    app.enableCors({
        origin: true, // Ajustar según producción
        credentials: true,
    });

    // REGISTRAR ADAPTADOR PERSONALIZADO
    app.useWebSocketAdapter(new SocketAdapter(app));

    app.setGlobalPrefix('api');

    await app.listen(process.env.PORT || 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

#### Paso 3: Verificar que el directorio common/adapters existe

```bash
mkdir -p backend/src/common/adapters
```

#### Paso 4: Deploy y Verificación

1. Hacer commit y push de los cambios
2. Verificar que en los logs de Railway aparezca:
   ```
   [SocketAdapter] Socket.IO server created on port: XXXX
   [WebSocket Gateway] WebSocket Gateway initialized successfully
   ```
3. Verificar que el frontend pueda conectar sin errores

## Referencias

- [NestJS WebSockets Documentation](https://docs.nestjs.com/websockets/gateways)
- [NestJS Adapter Documentation](https://docs.nestjs.com/websockets/adapter)
- [Railway - NestJS Socket.IO Port Discussion](https://station.railway.com/questions/nest-js-rest-api-socket-io-port-expose-44e3a31c)
- [Socket.IO Troubleshooting](https://socket.io/docs/v4/troubleshooting-connection-issues/)

## Notas Adicionales

### Opcional: Redis Adapter para Escalado

Si en el futuro necesitas múltiples instancias del backend, puedes usar Redis adapter:

```typescript
import { ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisSocketAdapter extends IoAdapter {
    async createIOServer(port: number, options?: ServerOptions) {
        const server = super.createIOServer(port, options);
        const redisClient = createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();
        const subClient = redisClient.duplicate();
        await subClient.connect();

        server.adapter(createAdapter(redisClient, subClient));
        console.log('[RedisSocketAdapter] Redis adapter configured');
        return server;
    }
}
```

### Opcional: Configuración de CORS más restrictiva

Para producción, reemplazar `origin: '*'` con:

```typescript
cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
}
```

## Checklist de Implementación

- [ ] Crear archivo `backend/src/common/adapters/socket.adapter.ts`
- [ ] Modificar `backend/src/main.ts` para registrar el adaptador
- [ ] Verificar que `GatewaysModule` está importado en `AppModule`
- [ ] Hacer commit y push
- [ ] Verificar logs de Railway
- [ ] Probar conexión desde frontend
- [ ] (Opcional) Configurar CORS más restrictivo para producción
