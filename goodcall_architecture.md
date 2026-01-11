# 🎯 GoodCall CRM - Arquitectura Completa del Sistema

## 📋 Índice
1. [Stack Tecnológico](#stack-tecnológico)
2. [Diagrama de Base de Datos (ERD)](#diagrama-de-base-de-datos-erd)
3. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Flujos de Trabajo](#flujos-de-trabajo)
6. [Sistema de Autenticación y Seguridad](#sistema-de-autenticación-y-seguridad)
7. [Sistema de Logs y Auditoría](#sistema-de-logs-y-auditoría)
8. [Especificaciones Técnicas](#especificaciones-técnicas)

---

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: React 18+ con TypeScript
- **Styling**: Tailwind CSS 3+
- **UI Components**: Radix UI + shadcn/ui
- **Animaciones**: Framer Motion
- **Estado Global**: Zustand
- **Formularios**: React Hook Form + Zod
- **Tablas**: TanStack Table v8
- **Tema**: next-themes (Light/Dark mode)
- **Notificaciones**: react-hot-toast
- **HTTP Client**: Axios con interceptores
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 20+
- **Framework**: NestJS 10+
- **Lenguaje**: TypeScript
- **ORM**: Prisma 5+
- **Base de Datos**: PostgreSQL 16+
- **Autenticación**: JWT + Refresh Tokens
- **2FA**: speakeasy + qrcode
- **Validación**: class-validator + class-transformer
- **Logging**: Winston
- **Encriptación**: bcrypt
- **Email**: Nodemailer (para 2FA)

### DevOps
- **Hosting**: Railway / Vercel
- **Base de Datos**: Railway PostgreSQL / Supabase
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errores) + LogTail (logs)

---

## 💡 Mejores Prácticas y Recomendaciones

### 1. Gestión de Estado del Servidor (Frontend)

**Recomendación**: Integrar **TanStack Query (React Query)** para el manejo de datos del servidor.

**Razón**: Aunque Zustand es excelente para estado de UI (modales, tema, preferencias), React Query es superior para datos del servidor porque:
- ✅ Caché automático inteligente
- ✅ Sincronización en segundo plano
- ✅ Reintentos automáticos en caso de error
- ✅ Estados de carga/error integrados (`isLoading`, `isError`, `isFetching`)
- ✅ Invalidación y refetch optimizados
- ✅ Paginación y scroll infinito simplificados

**Implementación**:

```typescript
// services/api.ts - Configurar React Query
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// hooks/useSales.ts - Ejemplo de uso
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useSales(filters = {}) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      const { data } = await api.get('/sales', { params: filters });
      return data;
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newSale) => {
      const { data } = await api.post('/sales', newSale);
      return data;
    },
    onSuccess: () => {
      // Invalidar y refetch automático
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}
```

**División de responsabilidades**:
- **Zustand**: Estado de UI (sidebar abierto/cerrado, tema, filtros locales)
- **React Query**: Datos del servidor (ventas, usuarios, metas)

---

### 2. Soft Deletes con Prisma

**Problema**: Prisma no soporta soft deletes nativamente. Necesitas filtrar manualmente `WHERE deleted_at IS NULL` en cada query.

**Solución**: Implementar un **Prisma Middleware** global.

```typescript
// database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    
    // Middleware para soft deletes
    this.$use(async (params, next) => {
      // Interceptar DELETE y convertirlo en UPDATE
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }
      
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }
      
      // Filtrar registros eliminados en queries de lectura
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }
      
      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where['deletedAt'] = null;
          }
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }
      
      return next(params);
    });
  }
}
```

**Beneficio**: Nunca más tendrás que recordar agregar `WHERE deleted_at IS NULL`. El middleware lo hace automáticamente.

---

### 3. Validación Global (Backend)

**Configuración recomendada** en `main.ts`:

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validación global con seguridad extra
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Elimina propiedades no definidas en DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true,            // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  await app.listen(3000);
}
```

**Beneficio**: Protección contra inyección de campos maliciosos. Si un atacante envía `{ username: "test", isAdmin: true }` pero `isAdmin` no está en tu DTO, será rechazado automáticamente.

---

### 4. Seguridad de Secretos 2FA

**Problema**: El campo `twoFactorSecret` es crítico. Si se compromete, un atacante puede generar códigos 2FA válidos.

**Recomendación**: Encriptar el secreto antes de guardarlo en la base de datos.

```typescript
// utils/encryption.util.ts
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// auth/auth.service.ts - Uso
async enable2FA(userId: string) {
  const secret = speakeasy.generateSecret({ name: `GoodCall (${user.username})` });
  
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encrypt(secret.base32), // ✅ Encriptado
    },
  });
  
  return { qrCode, secret: secret.base32 };
}

async verify2FA(userId: string, token: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  
  const decryptedSecret = decrypt(user.twoFactorSecret); // ✅ Desencriptado
  
  return speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: token,
  });
}
```

**Variable de entorno adicional**:
```env
# .env
ENCRYPTION_KEY=your-32-byte-hex-key-here-must-be-32-chars
```

**Generar clave**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 5. Rate Limiting Específico por Endpoint

Además del rate limiting global, agrega límites específicos para endpoints sensibles:

```typescript
// auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // 5 intentos por minuto para login
  @Throttle(5, 60)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
  
  // 3 intentos por minuto para 2FA
  @Throttle(3, 60)
  @Post('verify-2fa')
  async verify2FA(@Body() dto: Verify2FADto) {
    // ...
  }
  
  // 10 intentos por hora para cambio de contraseña
  @Throttle(10, 3600)
  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto) {
    // ...
  }
}
```

---

### 6. Índices de Base de Datos Optimizados

Asegúrate de que todos los índices críticos estén en su lugar:

```sql
-- Índices para queries frecuentes
CREATE INDEX idx_sales_asesor_date ON sales(asesor_id, sale_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_status_active ON sales(sale_status_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_coordinator_role ON users(coordinator_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
```

---

### 7. Estructura de Carpetas Recomendada (Actualizada)

```
src/
├── features/
│   ├── auth/
│   │   ├── hooks/
│   │   │   ├── useLogin.ts          # React Query
│   │   │   ├── useChangePassword.ts # React Query
│   │   │   └── use2FA.ts            # React Query
│   │   └── components/
│   │
│   ├── sales/
│   │   ├── hooks/
│   │   │   ├── useSales.ts          # React Query
│   │   │   ├── useCreateSale.ts     # React Query
│   │   │   └── useUpdateSale.ts     # React Query
│   │   └── components/
│   │
│   └── users/
│       ├── hooks/
│       │   ├── useUsers.ts          # React Query
│       │   └── useCreateUser.ts     # React Query
│       └── components/
│
├── stores/                           # Solo para estado de UI
│   ├── uiStore.ts                   # Sidebar, modales, tema
│   └── filtersStore.ts              # Filtros locales
│
└── services/
    └── api.ts                       # Axios + interceptores
```

---

## 📊 Stack Tecnológico Actualizado

### Frontend
- **Framework**: React 18+ con TypeScript
- **Styling**: Tailwind CSS 3+
- **UI Components**: Radix UI + shadcn/ui
- **Animaciones**: Framer Motion
- **Estado UI**: Zustand
- **Estado Servidor**: **TanStack Query v5** ⭐ (NUEVO)
- **Formularios**: React Hook Form + Zod
- **Tablas**: TanStack Table v8
- **Tema**: next-themes (Light/Dark mode)
- **Notificaciones**: react-hot-toast
- **HTTP Client**: Axios con interceptores
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 20+
- **Framework**: NestJS 10+
- **Lenguaje**: TypeScript
- **ORM**: Prisma 5+ con Middleware para Soft Deletes ⭐ (MEJORADO)
- **Base de Datos**: PostgreSQL 16+
- **Autenticación**: JWT + Refresh Tokens
- **2FA**: speakeasy + qrcode + Encriptación AES-256 ⭐ (MEJORADO)
- **Validación**: class-validator + class-transformer con whitelist ⭐ (MEJORADO)
- **Logging**: Winston
- **Encriptación**: bcrypt + crypto (para 2FA secrets) ⭐ (NUEVO)

---

## 🗄️ Diagrama de Base de Datos (ERD)

```sql
-- ============================================
-- TABLA: users (Usuarios del sistema)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'developer', 'gerencia', 'coordinador', 'asesor'
  
  -- Relaciones
  coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL si es developer/gerencia
  
  -- Seguridad
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  failed_login_attempts INT DEFAULT 0,
  locked_at TIMESTAMP,
  locked_by UUID REFERENCES users(id),
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  must_change_password BOOLEAN DEFAULT true,
  
  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  two_factor_backup_codes TEXT[], -- Array de códigos de respaldo
  
  -- Sesiones
  current_session_token VARCHAR(255),
  current_device_info JSONB, -- {device, ip, browser, os}
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP, -- Soft delete
  deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- TABLA: worker_roles (Roles adicionales de trabajadores)
-- ============================================
CREATE TABLE worker_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_type VARCHAR(50) NOT NULL, -- 'cerrador', 'fidelizador', etc.
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(user_id, role_type)
);

-- ============================================
-- TABLA: sales (Ventas)
-- ============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Información del cliente
  client_name VARCHAR(255),
  client_dni VARCHAR(50),
  client_phone VARCHAR(50),
  
  -- Compañía
  company_id UUID REFERENCES companies(id),
  company_sold_id UUID REFERENCES companies(id),
  
  -- Asignaciones
  asesor_id UUID NOT NULL REFERENCES users(id),
  cerrador_id UUID REFERENCES users(id),
  fidelizador_id UUID REFERENCES users(id),
  
  -- Estado
  sale_status_id UUID REFERENCES sale_statuses(id),
  technology_id UUID REFERENCES technologies(id),
  
  -- Información adicional
  extra_info TEXT,
  proof_field TEXT, -- Campo de prueba/sondeo
  
  -- Métricas (calculadas)
  is_active BOOLEAN DEFAULT false, -- Si está en estados activos
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- TABLA: companies (Compañías/Operadores)
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- TABLA: sale_statuses (Estados de venta)
-- ============================================
CREATE TABLE sale_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE,
  color VARCHAR(7), -- Hex color para UI
  icon VARCHAR(50), -- Emoji o icon name
  is_active_status BOOLEAN DEFAULT false, -- Si cuenta como venta activa
  is_final BOOLEAN DEFAULT false, -- Si es un estado terminal
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- TABLA: technologies (Tecnologías)
-- ============================================
CREATE TABLE technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- TABLA: goals (Metas)
-- ============================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alcance de la meta
  goal_type VARCHAR(20) NOT NULL, -- 'global', 'coordinador', 'asesor'
  target_user_id UUID REFERENCES users(id), -- NULL para global
  
  -- Período
  year INT NOT NULL,
  month INT NOT NULL, -- 1-12
  
  -- Meta
  target_sales INT NOT NULL,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(goal_type, target_user_id, year, month)
);

-- ============================================
-- TABLA: field_visibility (Visibilidad de campos)
-- ============================================
CREATE TABLE field_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Configuración
  coordinator_id UUID NOT NULL REFERENCES users(id),
  asesor_id UUID REFERENCES users(id), -- NULL = aplica a todo el equipo
  
  -- Campos ocultos (array de nombres de columnas)
  hidden_fields TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(coordinator_id, asesor_id)
);

-- ============================================
-- TABLA: activity_logs (Logs de auditoría)
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quién y cuándo
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'create_sale', 'update_sale', etc.
  
  -- Contexto
  entity_type VARCHAR(50), -- 'sale', 'user', 'goal', etc.
  entity_id UUID,
  
  -- Detalles
  description TEXT,
  old_values JSONB, -- Estado anterior
  new_values JSONB, -- Estado nuevo
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: login_attempts (Intentos de login)
-- ============================================
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255),
  email VARCHAR(255),
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  failure_reason VARCHAR(255), -- 'invalid_password', 'account_locked', etc.
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: session_conflicts (Conflictos de sesión)
-- ============================================
CREATE TABLE session_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Sesión anterior
  old_device_info JSONB,
  old_ip_address VARCHAR(45),
  
  -- Nueva sesión
  new_device_info JSONB,
  new_ip_address VARCHAR(45),
  
  -- Resolución
  resolved BOOLEAN DEFAULT false,
  resolved_action VARCHAR(50), -- 'continued', 'blocked'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: notifications (Notificaciones)
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  type VARCHAR(50) NOT NULL, -- 'account_locked', 'session_conflict', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Metadata
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  action_url VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: system_settings (Configuración del sistema)
-- ============================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Si puede verse por no-developers
  
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Configuración inicial
INSERT INTO system_settings (key, value, description, is_public) VALUES
('company_name', 'GoodCall', 'Nombre del call center', true),
('max_login_attempts', '5', 'Intentos máximos de login antes de bloquear', false),
('session_timeout_minutes', '480', 'Tiempo de expiración de sesión (8 horas)', false),
('require_2fa_for_gerencia', 'false', '2FA obligatorio para gerencia', false);

-- ============================================
-- ÍNDICES
-- ============================================

-- Users
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_coordinator ON users(coordinator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;

-- Sales
CREATE INDEX idx_sales_asesor ON sales(asesor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_date ON sales(sale_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_status ON sales(sale_status_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_active ON sales(is_active) WHERE deleted_at IS NULL;

-- Activity Logs
CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Login Attempts
CREATE INDEX idx_login_attempts_username ON login_attempts(username, created_at DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, created_at DESC);
```

---

## 🔐 Sistema de Roles y Permisos

### Matriz de Permisos Completa

| Funcionalidad | Developer | Gerencia | Coordinador | Asesor |
|---------------|-----------|----------|-------------|---------|
| **USUARIOS** |
| Ver todos los usuarios | ✅ | ✅ | ❌ (solo su equipo) | ❌ |
| Crear usuarios | ✅ | ✅ | ❌ | ❌ |
| Editar usuarios | ✅ | ✅ | ❌ | ❌ |
| Eliminar usuarios | ✅ | ✅ (soft delete) | ❌ | ❌ |
| Desbloquear cuentas | ✅ | ✅ | ❌ | ❌ |
| Resetear contraseñas | ✅ | ❌ | ❌ | ❌ |
| Asignar coordinadores | ✅ | ✅ | ❌ | ❌ |
| Gestionar roles adicionales | ✅ | ✅ | ❌ | ❌ |
| **VENTAS** |
| Ver ventas | ✅ (todas) | ✅ (todas) | ✅ (su equipo) | ✅ (solo suyas) |
| Crear ventas | ✅ | ✅ | ✅ | ✅ |
| Editar ventas | ✅ | ✅ | ✅ (su equipo) | ❌ |
| Eliminar ventas | ✅ | ✅ | ✅ (su equipo) | ❌ |
| Ver ventas eliminadas | ✅ | ✅ | ❌ | ❌ |
| Restaurar ventas | ✅ | ✅ | ❌ | ❌ |
| **METAS** |
| Ver metas | ✅ (todas) | ✅ (todas) | ✅ (su equipo) | ✅ (solo suya) |
| Crear/Editar meta global | ✅ | ✅ | ❌ | ❌ |
| Crear/Editar meta coordinador | ✅ | ✅ | ✅ (solo suya) | ❌ |
| Crear/Editar meta asesor | ✅ | ✅ | ✅ (su equipo) | ❌ |
| **CONFIGURACIÓN** |
| Listas (compañías, estados, etc.) | ✅ | ✅ | ❌ | ❌ |
| Visibilidad de campos | ✅ | ✅ | ✅ (su equipo) | ❌ |
| Configuración del sistema | ✅ | ❌ | ❌ | ❌ |
| Nombre del call center | ✅ | ❌ | ❌ | ❌ |
| **LOGS Y AUDITORÍA** |
| Ver todos los logs | ✅ | ✅ | ❌ | ❌ |
| Ver logs de su equipo | ✅ | ✅ | ✅ | ❌ |
| Eliminar logs | ❌ | ❌ | ❌ | ❌ |
| Exportar logs | ✅ | ✅ | ❌ | ❌ |
| **REPORTES** |
| Dashboard general | ✅ | ✅ | ❌ | ❌ |
| Dashboard por coordinador | ✅ | ✅ | ✅ (solo suyo) | ❌ |
| Dashboard por asesor | ✅ | ✅ | ✅ (su equipo) | ✅ (solo suyo) |
| Exportar reportes | ✅ | ✅ | ✅ | ❌ |

### Jerarquía de Roles

```
Developer (ROOT)
    ↓
Gerencia
    ↓
Coordinador 1
    ↓
    ├── Asesor 1
    ├── Asesor 2
    └── Asesor 3
    
Coordinador 2
    ↓
    ├── Asesor 4
    └── Asesor 5
```

### Lógica de Permisos en el Backend

```typescript
// decorators/roles.decorator.ts
export enum UserRole {
  DEVELOPER = 'developer',
  GERENCIA = 'gerencia',
  COORDINADOR = 'coordinador',
  ASESOR = 'asesor'
}

export const ROLE_HIERARCHY = {
  [UserRole.DEVELOPER]: 4,
  [UserRole.GERENCIA]: 3,
  [UserRole.COORDINADOR]: 2,
  [UserRole.ASESOR]: 1
};

// guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler()
    );
    
    return this.checkPermission(user, requiredPermission);
  }
  
  private checkPermission(user: User, permission: string): boolean {
    // Lógica de permisos basada en rol y jerarquía
    // ...
  }
}
```

---

## 📁 Estructura del Proyecto

### Frontend (React + TypeScript)

```
src/
├── app/                          # Configuración de la app
│   ├── App.tsx
│   ├── router.tsx               # React Router config
│   └── providers.tsx            # Context providers
│
├── components/                   # Componentes reutilizables
│   ├── ui/                      # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── sales/
│   │   ├── SalesTable.tsx
│   │   ├── SalesForm.tsx
│   │   ├── SalesFilters.tsx
│   │   └── SalesStats.tsx
│   ├── users/
│   │   ├── UserTable.tsx
│   │   ├── UserForm.tsx
│   │   └── UserAssignment.tsx
│   └── common/
│       ├── DataTable.tsx
│       ├── ConfirmDialog.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── features/                     # Features por dominio
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ChangePasswordModal.tsx
│   │   │   └── Setup2FA.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── api/
│   │       └── authApi.ts
│   │
│   ├── dashboard/
│   │   ├── DeveloperDashboard.tsx
│   │   ├── GerenciaDashboard.tsx
│   │   ├── CoordinadorDashboard.tsx
│   │   └── AsesorDashboard.tsx
│   │
│   ├── sales/
│   │   ├── pages/
│   │   │   ├── SalesListPage.tsx
│   │   │   ├── SalesCreatePage.tsx
│   │   │   └── SalesDetailPage.tsx
│   │   ├── hooks/
│   │   │   ├── useSales.ts
│   │   │   └── useSalesFilters.ts
│   │   └── api/
│   │       └── salesApi.ts
│   │
│   ├── users/
│   │   ├── pages/
│   │   │   ├── UsersListPage.tsx
│   │   │   └── UserDetailPage.tsx
│   │   └── api/
│   │       └── usersApi.ts
│   │
│   ├── goals/
│   │   ├── GoalsManager.tsx
│   │   └── api/
│   │       └── goalsApi.ts
│   │
│   ├── config/
│   │   ├── pages/
│   │   │   ├── CompaniesConfig.tsx
│   │   │   ├── StatusesConfig.tsx
│   │   │   ├── TechnologiesConfig.tsx
│   │   │   └── FieldVisibilityConfig.tsx
│   │   └── api/
│   │       └── configApi.ts
│   │
│   └── logs/
│       ├── LogsViewer.tsx
│       └── api/
│           └── logsApi.ts
│
├── stores/                       # Zustand stores
│   ├── authStore.ts
│   ├── userStore.ts
│   ├── salesStore.ts
│   └── configStore.ts
│
├── services/                     # Servicios
│   ├── api.ts                   # Axios instance
│   ├── authService.ts
│   └── storageService.ts
│
├── hooks/                        # Custom hooks globales
│   ├── usePermissions.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
│
├── types/                        # TypeScript types
│   ├── user.types.ts
│   ├── sale.types.ts
│   ├── goal.types.ts
│   └── api.types.ts
│
├── utils/                        # Utilidades
│   ├── dateUtils.ts
│   ├── formatters.ts
│   └── validators.ts
│
├── constants/                    # Constantes
│   ├── roles.ts
│   ├── permissions.ts
│   └── routes.ts
│
└── styles/
    ├── globals.css
    └── themes.css
```

### Backend (NestJS + TypeScript)

```
src/
├── main.ts                       # Entry point
├── app.module.ts                 # Root module
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── refresh-token.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       └── change-password.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── sales/
│   │   ├── sales.module.ts
│   │   ├── sales.controller.ts
│   │   ├── sales.service.ts
│   │   ├── entities/
│   │   │   └── sale.entity.ts
│   │   └── dto/
│   │       ├── create-sale.dto.ts
│   │       ├── update-sale.dto.ts
│   │       └── filter-sales.dto.ts
│   │
│   ├── goals/
│   │   ├── goals.module.ts
│   │   ├── goals.controller.ts
│   │   ├── goals.service.ts
│   │   └── entities/
│   │       └── goal.entity.ts
│   │
│   ├── config/
│   │   ├── companies/
│   │   ├── statuses/
│   │   └── technologies/
│   │
│   ├── logs/
│   │   ├── logs.module.ts
│   │   ├── logs.service.ts
│   │   └── entities/
│   │       └── activity-log.entity.ts
│   │
│   └── notifications/
│       ├── notifications.module.ts
│       ├── notifications.service.ts
│       └── notifications.gateway.ts
│
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── permissions.decorator.ts
│   │   └── current-user.decorator.ts
│   │
│   ├── guards/
│   │   ├── permissions.guard.ts
│   │   └── throttle.guard.ts
│   │
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   │
│   ├── filters/
│   │   └── http-exception.filter.ts
│   │
│   └── pipes/
│       └── validation.pipe.ts
│
├── database/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seeds/
│   │       └── initial-data.ts
│   │
│   └── database.module.ts
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
│
└── utils/
    ├── encryption.util.ts
    ├── date.util.ts
    └── validators.util.ts
```

---

## 🔄 Flujos de Trabajo

### 1. Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Ingresa credenciales
    F->>B: POST /auth/login
    B->>DB: Validar usuario
    
    alt Cuenta bloqueada
        B-->>F: 403 Forbidden
        F-->>U: "Cuenta bloqueada"
    else Credenciales inválidas
        B->>DB: Incrementar failed_attempts
        alt >= 5 intentos
            B->>DB: Bloquear cuenta
            B->>DB: Notificar coordinador
        end
        B-->>F: 401 Unauthorized
    else Credenciales válidas
        alt 2FA habilitado
            B-->>F: 200 + require_2fa
            U->>F: Ingresa código 2FA
            F->>B: POST /auth/verify-2fa
            B->>DB: Validar código
        end
        
        alt must_change_password
            B-->>F: 200 + force_password_change
            U->>F: Ingresa nueva contraseña
            F->>B: POST /auth/change-password
        end
        
        alt Sesión activa en otro dispositivo
            B->>DB: Guardar session_conflict
            B->>DB: Notificar sesión anterior
            B->>DB: Cerrar sesión anterior
        end
        
        B->>DB: Guardar sesión actual
        B->>DB: Log: login exitoso
        B-->>F: JWT + Refresh Token
        F->>F: Guardar tokens
        F-->>U: Redirigir a dashboard
    end
```

### 2. Flujo de Creación de Venta

```mermaid
sequenceDiagram
    participant A as Asesor
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    A->>F: Completa formulario
    F->>F: Validar campos
    F->>B: POST /sales
    B->>B: Validar permisos
    B->>DB: Crear venta
    B->>DB: Log: create_sale
    B->>DB: Actualizar métricas
    B-->>F: 201 Created
    F-->>A: "Venta creada exitosamente"
```

### 3. Flujo de Edición de Venta (Coordinador)

```mermaid
sequenceDiagram
    participant C as Coordinador
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    C->>F: Edita venta de su equipo
    F->>B: PATCH /sales/:id
    B->>DB: Verificar ownership (es de su equipo?)
    
    alt No es de su equipo
        B-->>F: 403 Forbidden
    else Es de su equipo
        B->>DB: Guardar old_values
        B->>DB: Actualizar venta
        B->>DB: Log: update_sale (old + new)
        B->>DB: Actualizar métricas
        B-->>F: 200 OK
        F-->>C: "Venta actualizada"
    end
```

### 4. Flujo de Bloqueo de Cuenta

```mermaid
sequenceDiagram
    participant U as Usuario
    participant S as Sistema
    participant C as Coordinador
    participant G as Gerencia

    U->>S: 5to intento fallido
    S->>S: Bloquear cuenta
    S->>S: Log: account_locked
    S->>C: Notificación: "Asesor X bloqueado"
    C->>G: Contacta para desbloquear
    G->>S: POST /users/:id/unlock
    S->>S: is_locked = false
    S->>S: failed_attempts = 0
    S->>U: Email: "Cuenta desbloqueada"
```

---

## 🔒 Sistema de Autenticación y Seguridad

### JWT Strategy

```typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || !user.is_active || user.is_locked) {
      throw new UnauthorizedException();
    }
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      coordinator_id: user.coordinator_id,
    };
  }
}
```

### Permissions Guard

```typescript
// common/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    
    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.checkPermission(user, requiredPermission, request);
  }

  private async checkPermission(
    user: any,
    permission: string,
    request: any,
  ): Promise<boolean> {
    // Lógica específica por permiso
    switch (permission) {
      case 'sales:view':
        return this.canViewSales(user, request);
      case 'sales:edit':
        return this.canEditSales(user, request);
      case 'sales:delete':
        return this.canDeleteSales(user, request);
      // ... más permisos
      default:
        return false;
    }
  }

  private async canViewSales(user: any, request: any): Promise<boolean> {
    if (user.role === 'developer' || user.role === 'gerencia') {
      return true; // Ven todas
    }
    
    if (user.role === 'coordinador') {
      // Solo ven ventas de su equipo
      const saleId = request.params.id;
      if (saleId) {
        const sale = await this.salesService.findOne(saleId);
        const asesor = await this.usersService.findById(sale.asesor_id);
        return asesor.coordinator_id === user.id;
      }
      return true; // En listado se filtrará automáticamente
    }
    
    if (user.role === 'asesor') {
      // Solo ven sus propias ventas
      const saleId = request.params.id;
      if (saleId) {
        const sale = await this.salesService.findOne(saleId);
        return sale.asesor_id === user.id;
      }
      return true; // En listado se filtrará automáticamente
    }
    
    return false;
  }
}
```

### Rate Limiting

```typescript
// main.ts
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: 'Demasiadas peticiones, intenta de nuevo más tarde.',
  }),
);

// Login endpoint con rate limit específico
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 intentos por minuto
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // ...
}
```

### 2FA Implementation

```typescript
// auth/auth.service.ts
async enable2FA(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `GoodCall (${user.username})`,
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  await this.usersService.update(userId, {
    two_factor_secret: secret.base32,
  });
  
  return { qrCode, secret: secret.base32 };
}

async verify2FA(userId: string, token: string): Promise<boolean> {
  const user = await this.usersService.findById(userId);
  
  return speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: token,
    window: 2, // Permite 2 códigos anteriores/posteriores
  });
}
```

---

## 📊 Sistema de Logs y Auditoría

### Log Service

```typescript
// logs/logs.service.ts
@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private logsRepository: Repository<ActivityLog>,
  ) {}

  async create(data: CreateLogDto) {
    return this.logsRepository.save({
      user_id: data.userId,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      description: data.description,
      old_values: data.oldValues,
      new_values: data.newValues,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      device_info: data.deviceInfo,
    });
  }

  async findAll(filters: LogFiltersDto) {
    const query = this.logsRepository.createQueryBuilder('log');
    
    if (filters.userId) {
      query.andWhere('log.user_id = :userId', { userId: filters.userId });
    }
    
    if (filters.action) {
      query.andWhere('log.action = :action', { action: filters.action });
    }
    
    if (filters.dateFrom) {
      query.andWhere('log.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    
    if (filters.dateTo) {
      query.andWhere('log.created_at <= :dateTo', { dateTo: filters.dateTo });
    }
    
    return query
      .orderBy('log.created_at', 'DESC')
      .take(filters.limit || 100)
      .skip(filters.offset || 0)
      .getMany();
  }
}
```

### Logging Interceptor

```typescript
// common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logsService: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip, headers } = request;
    const userAgent = headers['user-agent'];
    
    const now = Date.now();
    
    return next.handle().pipe(
      tap(async (response) => {
        const executionTime = Date.now() - now;
        
        // Solo loguear operaciones importantes
        if (this.shouldLog(method, url)) {
          await this.logsService.create({
            userId: user?.id,
            action: this.getActionName(method, url),
            description: `${method} ${url}`,
            ipAddress: ip,
            userAgent: userAgent,
            newValues: body,
          });
        }
      }),
    );
  }

  private shouldLog(method: string, url: string): boolean {
    // No loguear GET ni endpoints públicos
    if (method === 'GET') return false;
    if (url.includes('/auth/refresh')) return false;
    return true;
  }

  private getActionName(method: string, url: string): string {
    // Mapear método y URL a nombre de acción
    // Ejemplo: POST /sales -> 'create_sale'
    // ...
  }
}
```

---

## ⚙️ Especificaciones Técnicas

### Variables de Entorno

```env
# Backend (.env)
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/goodcall"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=8h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
SESSION_TIMEOUT_MINUTES=480

# Email (para 2FA)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@goodcall.com
SMTP_PASSWORD=your-email-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Cors
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

```env
# Frontend (.env)
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=GoodCall CRM
VITE_APP_VERSION=1.0.0
```

### Prisma Schema (Ejemplo parcial)

```prisma
// database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String    @id @default(uuid())
  username              String    @unique @db.VarChar(50)
  email                 String    @unique @db.VarChar(255)
  passwordHash          String    @map("password_hash") @db.VarChar(255)
  firstName             String    @map("first_name") @db.VarChar(100)
  lastName              String    @map("last_name") @db.VarChar(100)
  role                  String    @db.VarChar(20)
  
  coordinatorId         String?   @map("coordinator_id")
  coordinator           User?     @relation("CoordinatorAsesores", fields: [coordinatorId], references: [id])
  asesores              User[]    @relation("CoordinatorAsesores")
  
  isActive              Boolean   @default(true) @map("is_active")
  isLocked              Boolean   @default(false) @map("is_locked")
  failedLoginAttempts   Int       @default(0) @map("failed_login_attempts")
  lockedAt              DateTime? @map("locked_at")
  lockedById            String?   @map("locked_by")
  lockedBy              User?     @relation("LockedByUser", fields: [lockedById], references: [id])
  
  lastLogin             DateTime? @map("last_login")
  passwordChangedAt     DateTime? @map("password_changed_at")
  mustChangePassword    Boolean   @default(true) @map("must_change_password")
  
  twoFactorEnabled      Boolean   @default(false) @map("two_factor_enabled")
  twoFactorSecret       String?   @map("two_factor_secret") @db.VarChar(255)
  twoFactorBackupCodes  String[]  @map("two_factor_backup_codes")
  
  currentSessionToken   String?   @map("current_session_token") @db.VarChar(255)
  currentDeviceInfo     Json?     @map("current_device_info")
  
  createdAt             DateTime  @default(now()) @map("created_at")
  createdById           String?   @map("created_by")
  createdBy             User?     @relation("CreatedByUser", fields: [createdById], references: [id])
  
  updatedAt             DateTime  @updatedAt @map("updated_at")
  updatedById           String?   @map("updated_by")
  updatedBy             User?     @relation("UpdatedByUser", fields: [updatedById], references: [id])
  
  deletedAt             DateTime? @map("deleted_at")
  deletedById           String?   @map("deleted_by")
  deletedBy             User?     @relation("DeletedByUser", fields: [deletedById], references: [id])
  
  // Relaciones
  sales                 Sale[]    @relation("AsesorSales")
  workerRoles           WorkerRole[]
  activityLogs          ActivityLog[]
  notifications         Notification[]
  
  @@map("users")
  @@index([role, deletedAt])
  @@index([coordinatorId, deletedAt])
}

model Sale {
  id                    String    @id @default(uuid())
  saleDate              DateTime  @default(now()) @map("sale_date") @db.Date
  
  clientName            String?   @map("client_name") @db.VarChar(255)
  clientDni             String?   @map("client_dni") @db.VarChar(50)
  clientPhone           String?   @map("client_phone") @db.VarChar(50)
  
  companyId             String?   @map("company_id")
  company               Company?  @relation("SaleCompany", fields: [companyId], references: [id])
  
  companySoldId         String?   @map("company_sold_id")
  companySold           Company?  @relation("SaleCompanySold", fields: [companySoldId], references: [id])
  
  asesorId              String    @map("asesor_id")
  asesor                User      @relation("AsesorSales", fields: [asesorId], references: [id])
  
  cerradorId            String?   @map("cerrador_id")
  fidelizadorId         String?   @map("fidelizador_id")
  
  saleStatusId          String?   @map("sale_status_id")
  saleStatus            SaleStatus? @relation(fields: [saleStatusId], references: [id])
  
  technologyId          String?   @map("technology_id")
  technology            Technology? @relation(fields: [technologyId], references: [id])
  
  extraInfo             String?   @map("extra_info") @db.Text
  proofField            String?   @map("proof_field") @db.Text
  
  isActive              Boolean   @default(false) @map("is_active")
  
  createdAt             DateTime  @default(now()) @map("created_at")
  createdById           String?   @map("created_by")
  
  updatedAt             DateTime  @updatedAt @map("updated_at")
  updatedById           String?   @map("updated_by")
  
  deletedAt             DateTime? @map("deleted_at")
  deletedById           String?   @map("deleted_by")
  
  @@map("sales")
  @@index([asesorId, deletedAt])
  @@index([saleDate, deletedAt])
}

// ... más modelos según el ERD
```

### API Endpoints (Resumen)

```
# Auth
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/change-password
POST   /api/auth/enable-2fa
POST   /api/auth/verify-2fa
POST   /api/auth/disable-2fa

# Users
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/unlock
POST   /api/users/:id/reset-password
PATCH  /api/users/:id/assign-coordinator

# Sales
GET    /api/sales
GET    /api/sales/:id
POST   /api/sales
PATCH  /api/sales/:id
DELETE /api/sales/:id
GET    /api/sales/stats
GET    /api/sales/export

# Goals
GET    /api/goals
GET    /api/goals/:id
POST   /api/goals
PATCH  /api/goals/:id
DELETE /api/goals/:id

# Companies
GET    /api/companies
POST   /api/companies
PATCH  /api/companies/:id
DELETE /api/companies/:id

# Sale Statuses
GET    /api/sale-statuses
POST   /api/sale-statuses
PATCH  /api/sale-statuses/:id
DELETE /api/sale-statuses/:id

# Technologies
GET    /api/technologies
POST   /api/technologies
PATCH  /api/technologies/:id
DELETE /api/technologies/:id

# Field Visibility
GET    /api/field-visibility/:coordinatorId
POST   /api/field-visibility
PATCH  /api/field-visibility/:id

# Activity Logs
GET    /api/logs
GET    /api/logs/:id
GET    /api/logs/export

# Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read
DELETE /api/notifications/:id

# System Settings
GET    /api/settings
PATCH  /api/settings/:key
```

---

## 🎨 Diseño de Vistas (Wireframes Textuales)

### 1. Dashboard Asesor

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 GoodCall           👤 Juan Pérez (Asesor)      [⚙️]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Mis Estadísticas - Enero 2026                      │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Mis Ventas   │ Ventas       │ Meta del Mes │        │
│  │              │ Activas      │              │        │
│  │     12       │      8       │     10       │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                         │
│  📋 Mis Ventas Recientes                  [+ Nueva]    │
│  ┌────────────────────────────────────────────────┐    │
│  │ Fecha     │ Cliente       │ Estado       │...  │    │
│  ├────────────────────────────────────────────────┤    │
│  │ 07/01/26  │ María López   │ 🔩 EN PROCESO│     │    │
│  │ 06/01/26  │ Pedro García  │ ✅ ACTIVO    │     │    │
│  │ 05/01/26  │ Ana Torres    │ ⏳ AGENDADO  │     │    │
│  └────────────────────────────────────────────────┘    │
│                                  [Ver todas →]         │
└─────────────────────────────────────────────────────────┘
```

### 2. Dashboard Coordinador

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 GoodCall        👤 YAZURY (Coordinador)        [⚙️]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Rendimiento del Equipo - Enero 2026               │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Total Ventas │ Ventas       │ Meta del     │        │
│  │ del Equipo   │ Activas      │ Equipo       │        │
│  │     45       │     32       │     56       │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                         │
│  👥 Rendimiento por Asesor                             │
│  ┌────────────────────────────────────────────────┐    │
│  │ Asesor    │ Ventas │ Activas │ Meta │ % Cumpl│    │
│  ├────────────────────────────────────────────────┤    │
│  │ KELLY     │   12   │    8    │  10  │  80%   │    │
│  │ ROSMERY   │    8   │    5    │   8  │  62.5% │    │
│  │ JULIO     │   10   │    7    │   8  │  87.5% │    │
│  │ CIELO     │    6   │    4    │   8  │  50%   │    │
│  │ JOSEPH    │    5   │    4    │   8  │  50%   │    │
│  │ CINTHIA   │    4   │    4    │   8  │  50%   │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  [Ver Ventas del Equipo] [Gestionar Metas] [Config]   │
└─────────────────────────────────────────────────────────┘
```

### 3. Panel de Ventas (Coordinador/Gerencia)

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Gestión de Ventas                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔍 Filtros:                                           │
│  [Asesor ▼] [Estado ▼] [Compañía ▼] [Fecha: ▼] [🔍]  │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ ID │ Fecha │ Cliente │ DNI │ Asesor │ Estado  │    │
│  ├────────────────────────────────────────────────┤    │
│  │ 001│07/01│María L│123..│KELLY│🔩 PROCESO│[✏️][🗑️]│
│  │ 002│07/01│Pedro G│456..│JULIO│✅ ACTIVO │[✏️][🗑️]│
│  │ 003│06/01│Ana T  │789..│KELLY│⏳AGENDADO│[✏️][🗑️]│
│  │ ... (scroll)                                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  Mostrando 1-50 de 234           [< 1 2 3 ... 5 >]    │
│                                                         │
│  [+ Nueva Venta]  [📥 Exportar]                        │
└─────────────────────────────────────────────────────────┘
```

### 4. Formulario Nueva Venta

```
┌─────────────────────────────────────────────────────────┐
│ ➕ Nueva Venta                                    [✖️]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📅 Fecha de Venta:  [07/01/2026]    (auto)           │
│                                                         │
│  👤 Información del Cliente                            │
│  ┌───────────────────────────────────────────────┐     │
│  │ Nombre:    [_____________________________]     │     │
│  │ DNI:       [_____________]                     │     │
│  │ Teléfono:  [_____________]                     │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  🏢 Información de la Venta                            │
│  ┌───────────────────────────────────────────────┐     │
│  │ Compañía:        [Seleccionar ▼]              │     │
│  │ Compañía Vendida:[Seleccionar ▼]              │     │
│  │ Cerrador:        [Seleccionar ▼]              │     │
│  │ Fidelizador:     [Seleccionar ▼]              │     │
│  │ Estado:          [Seleccionar ▼]              │     │
│  │ Tecnología:      [Seleccionar ▼]              │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  📝 Información Adicional                              │
│  ┌───────────────────────────────────────────────┐     │
│  │ Info Extra: [________________________]         │     │
│  │             [________________________]         │     │
│  │ Prueba:     [________________________]         │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│           [Cancelar]        [Guardar Venta]            │
└─────────────────────────────────────────────────────────┘
```

### 5. Configuración de Visibilidad de Campos (Coordinador)

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Configurar Visibilidad de Campos                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👥 Aplicar a:  [○ Todo el equipo  ● Asesor específico]│
│                                                         │
│  Asesor: [KELLY ▼]                                     │
│                                                         │
│  Campos Disponibles:                                   │
│  ┌───────────────────────────────────────────────┐     │
│  │ ☑️ Fecha                                       │     │
│  │ ☑️ Cliente                                     │     │
│  │ ☐ DNI                    (oculto)              │     │
│  │ ☑️ Teléfono                                    │     │
│  │ ☑️ Compañía                                    │     │
│  │ ☑️ Cerrador                                    │     │
│  │ ☑️ Fidelizador                                 │     │
│  │ ☑️ Compañía Vendida                            │     │
│  │ ☑️ Estado de Venta                             │     │
│  │ ☑️ Tecnología                                  │     │
│  │ ☐ Info Extra             (oculto)              │     │
│  │ ☑️ Prueba                                      │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│           [Cancelar]        [Guardar Cambios]          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Próximos Pasos para Implementación

### Fase 1: Setup Inicial (Semana 1)
- [ ] Configurar repositorio Git
- [ ] Setup del backend (NestJS + Prisma)
- [ ] Setup del frontend (React + Vite)
- [ ] Configurar base de datos PostgreSQL
- [ ] Configurar variables de entorno
- [ ] Ejecutar migraciones iniciales

### Fase 2: Autenticación (Semana 2)
- [ ] Implementar sistema de login
- [ ] Implementar JWT + Refresh Tokens
- [ ] Implementar 2FA opcional
- [ ] Implementar cambio de contraseña forzado
- [ ] Implementar bloqueo de cuentas
- [ ] Implementar detección de sesiones múltiples

### Fase 3: Gestión de Usuarios (Semana 3)
- [ ] CRUD de usuarios
- [ ] Asignación de coordinadores
- [ ] Sistema de roles adicionales
- [ ] Permisos por rol
- [ ] Panel de administración de usuarios

### Fase 4: Gestión de Ventas (Semana 4-5)
- [ ] CRUD de ventas
- [ ] Filtros y búsqueda avanzada
- [ ] Sistema de visibilidad de campos
- [ ] Validaciones por rol
- [ ] Exportación de datos

### Fase 5: Metas y Estadísticas (Semana 6)
- [ ] Sistema de metas (global, coordinador, asesor)
- [ ] Cálculo de métricas
- [ ] Dashboards por rol
- [ ] Gráficos y reportes

### Fase 6: Configuración (Semana 7)
- [ ] Gestión de compañías
- [ ] Gestión de estados
- [ ] Gestión de tecnologías
- [ ] Configuración del sistema

### Fase 7: Logs y Auditoría (Semana 8)
- [ ] Sistema de logs completo
- [ ] Visor de logs con filtros
- [ ] Exportación de logs
- [ ] Logs de sesiones y conflictos

### Fase 8: Testing y Deployment (Semana 9-10)
- [ ] Testing unitario backend
- [ ] Testing integración
- [ ] Testing E2E frontend
- [ ] Setup CI/CD
- [ ] Deploy a producción
- [ ] Documentación de API

---

## 📚 Recursos Adicionales

### Documentación Recomendada
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Herramientas de Desarrollo
- **Postman/Insomnia**: Testing de API
- **TablePlus/DBeaver**: Cliente de PostgreSQL
- **Storybook**: Documentación de componentes UI
- **ESLint + Prettier**: Code quality

---

**Documento generado el 07/01/2026 para el proyecto GoodCall CRM**
**Versión: 1.0**
**Desarrollador: [Tu nombre]**
