# 💻 GoodCall CRM - Guía de Implementación con Código

## 📋 Índice
1. [Prisma Schema Completo](#prisma-schema-completo)
2. [Ejemplos de DTOs](#ejemplos-de-dtos)
3. [Ejemplos de Controllers](#ejemplos-de-controllers)
4. [Ejemplos de Services](#ejemplos-de-services)
5. [Ejemplos de Guards y Decorators](#ejemplos-de-guards-y-decorators)
6. [Componentes React Clave](#componentes-react-clave)
7. [Custom Hooks](#custom-hooks)
8. [Zustand Stores](#zustand-stores)

---

## 🗄️ Prisma Schema Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS
// ============================================
model User {
  id                    String    @id @default(uuid())
  username              String    @unique @db.VarChar(50)
  email                 String    @unique @db.VarChar(255)
  passwordHash          String    @map("password_hash") @db.VarChar(255)
  firstName             String    @map("first_name") @db.VarChar(100)
  lastName              String    @map("last_name") @db.VarChar(100)
  role                  UserRole
  
  // Relaciones jerárquicas
  coordinatorId         String?   @map("coordinator_id")
  coordinator           User?     @relation("CoordinatorAsesores", fields: [coordinatorId], references: [id], onDelete: SetNull)
  asesores              User[]    @relation("CoordinatorAsesores")
  
  // Seguridad
  isActive              Boolean   @default(true) @map("is_active")
  isLocked              Boolean   @default(false) @map("is_locked")
  failedLoginAttempts   Int       @default(0) @map("failed_login_attempts")
  lockedAt              DateTime? @map("locked_at")
  lockedById            String?   @map("locked_by")
  lockedBy              User?     @relation("LockedByUser", fields: [lockedById], references: [id], onDelete: SetNull)
  lockedUsers           User[]    @relation("LockedByUser")
  
  lastLogin             DateTime? @map("last_login")
  passwordChangedAt     DateTime? @map("password_changed_at")
  mustChangePassword    Boolean   @default(true) @map("must_change_password")
  
  // 2FA
  twoFactorEnabled      Boolean   @default(false) @map("two_factor_enabled")
  twoFactorSecret       String?   @map("two_factor_secret") @db.VarChar(255)
  twoFactorBackupCodes  String[]  @map("two_factor_backup_codes")
  
  // Sesión
  currentSessionToken   String?   @map("current_session_token") @db.VarChar(255)
  currentDeviceInfo     Json?     @map("current_device_info")
  
  // Auditoría
  createdAt             DateTime  @default(now()) @map("created_at")
  createdById           String?   @map("created_by")
  createdBy             User?     @relation("CreatedByUser", fields: [createdById], references: [id], onDelete: SetNull)
  usersCreated          User[]    @relation("CreatedByUser")
  
  updatedAt             DateTime  @updatedAt @map("updated_at")
  updatedById           String?   @map("updated_by")
  updatedBy             User?     @relation("UpdatedByUser", fields: [updatedById], references: [id], onDelete: SetNull)
  usersUpdated          User[]    @relation("UpdatedByUser")
  
  deletedAt             DateTime? @map("deleted_at")
  deletedById           String?   @map("deleted_by")
  deletedBy             User?     @relation("DeletedByUser", fields: [deletedById], references: [id], onDelete: SetNull)
  usersDeleted          User[]    @relation("DeletedByUser")
  
  // Relaciones
  sales                 Sale[]    @relation("AsesorSales")
  workerRoles           WorkerRole[]
  activityLogs          ActivityLog[]
  notifications         Notification[]
  sessionConflicts      SessionConflict[]
  goalsTarget           Goal[]    @relation("TargetUser")
  goalsCreated          Goal[]    @relation("GoalCreatedBy")
  goalsUpdated          Goal[]    @relation("GoalUpdatedBy")
  
  @@map("users")
  @@index([role, deletedAt])
  @@index([coordinatorId, deletedAt])
  @@index([email])
  @@index([username])
}

enum UserRole {
  developer
  gerencia
  coordinador
  asesor
}

// ============================================
// WORKER ROLES
// ============================================
model WorkerRole {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleType    String   @map("role_type") @db.VarChar(50) // cerrador, fidelizador, etc.
  isActive    Boolean  @default(true) @map("is_active")
  
  createdAt   DateTime @default(now()) @map("created_at")
  createdById String?  @map("created_by")
  
  @@unique([userId, roleType])
  @@map("worker_roles")
}

// ============================================
// SALES
// ============================================
model Sale {
  id              String      @id @default(uuid())
  saleDate        DateTime    @default(now()) @map("sale_date") @db.Date
  
  // Cliente
  clientName      String?     @map("client_name") @db.VarChar(255)
  clientDni       String?     @map("client_dni") @db.VarChar(50)
  clientPhone     String?     @map("client_phone") @db.VarChar(50)
  
  // Compañías
  companyId       String?     @map("company_id")
  company         Company?    @relation("SaleCompany", fields: [companyId], references: [id], onDelete: SetNull)
  
  companySoldId   String?     @map("company_sold_id")
  companySold     Company?    @relation("SaleCompanySold", fields: [companySoldId], references: [id], onDelete: SetNull)
  
  // Asignaciones
  asesorId        String      @map("asesor_id")
  asesor          User        @relation("AsesorSales", fields: [asesorId], references: [id], onDelete: Restrict)
  
  cerradorId      String?     @map("cerrador_id")
  fidelizadorId   String?     @map("fidelizador_id")
  
  // Estado y Tecnología
  saleStatusId    String?     @map("sale_status_id")
  saleStatus      SaleStatus? @relation(fields: [saleStatusId], references: [id], onDelete: SetNull)
  
  technologyId    String?     @map("technology_id")
  technology      Technology? @relation(fields: [technologyId], references: [id], onDelete: SetNull)
  
  // Campos adicionales
  extraInfo       String?     @map("extra_info") @db.Text
  proofField      String?     @map("proof_field") @db.Text
  
  // Métricas
  isActive        Boolean     @default(false) @map("is_active")
  
  // Auditoría
  createdAt       DateTime    @default(now()) @map("created_at")
  createdById     String?     @map("created_by")
  
  updatedAt       DateTime    @updatedAt @map("updated_at")
  updatedById     String?     @map("updated_by")
  
  deletedAt       DateTime?   @map("deleted_at")
  deletedById     String?     @map("deleted_by")
  
  @@map("sales")
  @@index([asesorId, deletedAt])
  @@index([saleDate, deletedAt])
  @@index([saleStatusId])
  @@index([isActive])
}

// ============================================
// COMPANIES
// ============================================
model Company {
  id            String   @id @default(uuid())
  name          String   @unique @db.VarChar(255)
  code          String?  @unique @db.VarChar(50)
  isActive      Boolean  @default(true) @map("is_active")
  displayOrder  Int      @default(0) @map("display_order")
  
  createdAt     DateTime @default(now()) @map("created_at")
  createdById   String?  @map("created_by")
  
  updatedAt     DateTime @updatedAt @map("updated_at")
  updatedById   String?  @map("updated_by")
  
  sales         Sale[]   @relation("SaleCompany")
  salesSold     Sale[]   @relation("SaleCompanySold")
  
  @@map("companies")
  @@index([isActive, displayOrder])
}

// ============================================
// SALE STATUSES
// ============================================
model SaleStatus {
  id              String   @id @default(uuid())
  name            String   @unique @db.VarChar(255)
  code            String?  @unique @db.VarChar(50)
  color           String?  @db.VarChar(7) // Hex color
  icon            String?  @db.VarChar(50)
  isActiveStatus  Boolean  @default(false) @map("is_active_status")
  isFinal         Boolean  @default(false) @map("is_final")
  displayOrder    Int      @default(0) @map("display_order")
  
  createdAt       DateTime @default(now()) @map("created_at")
  createdById     String?  @map("created_by")
  
  updatedAt       DateTime @updatedAt @map("updated_at")
  updatedById     String?  @map("updated_by")
  
  sales           Sale[]
  
  @@map("sale_statuses")
  @@index([isActiveStatus])
}

// ============================================
// TECHNOLOGIES
// ============================================
model Technology {
  id            String   @id @default(uuid())
  name          String   @unique @db.VarChar(255)
  code          String?  @unique @db.VarChar(50)
  isActive      Boolean  @default(true) @map("is_active")
  displayOrder  Int      @default(0) @map("display_order")
  
  createdAt     DateTime @default(now()) @map("created_at")
  createdById   String?  @map("created_by")
  
  updatedAt     DateTime @updatedAt @map("updated_at")
  updatedById   String?  @map("updated_by")
  
  sales         Sale[]
  
  @@map("technologies")
}

// ============================================
// GOALS
// ============================================
model Goal {
  id            String   @id @default(uuid())
  goalType      GoalType @map("goal_type")
  targetUserId  String?  @map("target_user_id")
  targetUser    User?    @relation("TargetUser", fields: [targetUserId], references: [id], onDelete: Cascade)
  
  year          Int
  month         Int      // 1-12
  
  targetSales   Int      @map("target_sales")
  
  createdAt     DateTime @default(now()) @map("created_at")
  createdById   String?  @map("created_by")
  createdBy     User?    @relation("GoalCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  
  updatedAt     DateTime @updatedAt @map("updated_at")
  updatedById   String?  @map("updated_by")
  updatedBy     User?    @relation("GoalUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  
  @@unique([goalType, targetUserId, year, month])
  @@map("goals")
  @@index([year, month])
}

enum GoalType {
  global
  coordinador
  asesor
}

// ============================================
// FIELD VISIBILITY
// ============================================
model FieldVisibility {
  id              String   @id @default(uuid())
  coordinatorId   String   @map("coordinator_id")
  asesorId        String?  @map("asesor_id") // NULL = todo el equipo
  hiddenFields    String[] @default([]) @map("hidden_fields")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@unique([coordinatorId, asesorId])
  @@map("field_visibility")
}

// ============================================
// ACTIVITY LOGS
// ============================================
model ActivityLog {
  id            String    @id @default(uuid())
  userId        String?   @map("user_id")
  user          User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  action        String    @db.VarChar(100)
  entityType    String?   @map("entity_type") @db.VarChar(50)
  entityId      String?   @map("entity_id")
  
  description   String?   @db.Text
  oldValues     Json?     @map("old_values")
  newValues     Json?     @map("new_values")
  
  ipAddress     String?   @map("ip_address") @db.VarChar(45)
  userAgent     String?   @map("user_agent") @db.Text
  deviceInfo    Json?     @map("device_info")
  
  createdAt     DateTime  @default(now()) @map("created_at")
  
  @@map("activity_logs")
  @@index([userId, createdAt])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
}

// ============================================
// LOGIN ATTEMPTS
// ============================================
model LoginAttempt {
  id              String   @id @default(uuid())
  username        String?  @db.VarChar(255)
  email           String?  @db.VarChar(255)
  success         Boolean
  ipAddress       String?  @map("ip_address") @db.VarChar(45)
  userAgent       String?  @map("user_agent") @db.Text
  failureReason   String?  @map("failure_reason") @db.VarChar(255)
  
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@map("login_attempts")
  @@index([username, createdAt(sort: Desc)])
  @@index([ipAddress, createdAt(sort: Desc)])
}

// ============================================
// SESSION CONFLICTS
// ============================================
model SessionConflict {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  oldDeviceInfo   Json?    @map("old_device_info")
  oldIpAddress    String?  @map("old_ip_address") @db.VarChar(45)
  
  newDeviceInfo   Json?    @map("new_device_info")
  newIpAddress    String?  @map("new_ip_address") @db.VarChar(45)
  
  resolved        Boolean  @default(false)
  resolvedAction  String?  @map("resolved_action") @db.VarChar(50)
  
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@map("session_conflicts")
  @@index([userId, resolved])
}

// ============================================
// NOTIFICATIONS
// ============================================
model Notification {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type                String    @db.VarChar(50)
  title               String    @db.VarChar(255)
  message             String    @db.Text
  
  isRead              Boolean   @default(false) @map("is_read")
  readAt              DateTime? @map("read_at")
  
  relatedEntityType   String?   @map("related_entity_type") @db.VarChar(50)
  relatedEntityId     String?   @map("related_entity_id")
  actionUrl           String?   @map("action_url") @db.VarChar(255)
  
  createdAt           DateTime  @default(now()) @map("created_at")
  
  @@map("notifications")
  @@index([userId, isRead, createdAt(sort: Desc)])
}

// ============================================
// SYSTEM SETTINGS
// ============================================
model SystemSetting {
  id          String   @id @default(uuid())
  key         String   @unique @db.VarChar(100)
  value       String?  @db.Text
  description String?  @db.Text
  isPublic    Boolean  @default(false) @map("is_public")
  
  updatedAt   DateTime @updatedAt @map("updated_at")
  updatedById String?  @map("updated_by")
  
  @@map("system_settings")
}
```

---

## 📝 Ejemplos de DTOs

### Auth DTOs

```typescript
// auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
    twoFactorEnabled: boolean;
  };
  requiresTwoFactor?: boolean;
  requiresPasswordChange?: boolean;
}

// auth/dto/change-password.dto.ts
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

// auth/dto/verify-2fa.dto.ts
export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

### User DTOs

```typescript
// users/dto/create-user.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsUUID()
  @IsOptional()
  coordinatorId?: string;
}

// users/dto/update-user.dto.ts
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  @IsOptional()
  coordinatorId?: string;
}

// users/dto/assign-coordinator.dto.ts
export class AssignCoordinatorDto {
  @IsUUID()
  @IsNotEmpty()
  coordinatorId: string;
}
```

### Sale DTOs

```typescript
// sales/dto/create-sale.dto.ts
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSaleDto {
  @IsDateString()
  @IsOptional()
  saleDate?: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientDni?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  companySoldId?: string;

  @IsUUID()
  @IsNotEmpty()
  asesorId: string;

  @IsUUID()
  @IsOptional()
  cerradorId?: string;

  @IsUUID()
  @IsOptional()
  fidelizadorId?: string;

  @IsUUID()
  @IsOptional()
  saleStatusId?: string;

  @IsUUID()
  @IsOptional()
  technologyId?: string;

  @IsString()
  @IsOptional()
  extraInfo?: string;

  @IsString()
  @IsOptional()
  proofField?: string;
}

// sales/dto/filter-sales.dto.ts
export class FilterSalesDto {
  @IsUUID()
  @IsOptional()
  asesorId?: string;

  @IsUUID()
  @IsOptional()
  coordinatorId?: string;

  @IsUUID()
  @IsOptional()
  saleStatusId?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  includeDeleted?: boolean;
}
```

---

## 🎯 Ejemplos de Controllers

### Auth Controller

```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto, Verify2FADto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(loginDto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  async verify2FA(@Body() verify2FADto: Verify2FADto, @Request() req) {
    return this.authService.verify2FA(verify2FADto.token, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('enable-2fa')
  async enable2FA(@CurrentUser() user) {
    return this.authService.enable2FA(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable-2fa')
  async disable2FA(@CurrentUser() user) {
    return this.authService.disable2FA(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user) {
    return this.authService.logout(user.id);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }
}
```

### Users Controller

```typescript
// users/users.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignCoordinatorDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.developer, UserRole.gerencia, UserRole.coordinador)
  async findAll(@CurrentUser() user, @Query() query) {
    return this.usersService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.developer, UserRole.gerencia, UserRole.coordinador)
  async findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.usersService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.developer, UserRole.gerencia)
  async create(@Body() createUserDto: CreateUserDto, @CurrentUser() user) {
    return this.usersService.create(createUserDto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.developer, UserRole.gerencia)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user,
  ) {
    return this.usersService.update(id, updateUserDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.developer, UserRole.gerencia)
  async remove(@Param('id') id: string, @CurrentUser() user) {
    return this.usersService.remove(id, user.id);
  }

  @Post(':id/unlock')
  @Roles(UserRole.developer, UserRole.gerencia)
  async unlock(@Param('id') id: string, @CurrentUser() user) {
    return this.usersService.unlock(id, user.id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.developer)
  async resetPassword(@Param('id') id: string, @CurrentUser() user) {
    return this.usersService.resetPassword(id, user.id);
  }

  @Patch(':id/assign-coordinator')
  @Roles(UserRole.developer, UserRole.gerencia)
  async assignCoordinator(
    @Param('id') id: string,
    @Body() assignCoordinatorDto: AssignCoordinatorDto,
    @CurrentUser() user,
  ) {
    return this.usersService.assignCoordinator(id, assignCoordinatorDto.coordinatorId, user.id);
  }
}
```

### Sales Controller

```typescript
// sales/sales.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, FilterSalesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  async findAll(@CurrentUser() user, @Query() filters: FilterSalesDto) {
    return this.salesService.findAll(user, filters);
  }

  @Get('stats')
  async getStats(@CurrentUser() user, @Query() query) {
    return this.salesService.getStats(user, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.salesService.findOne(id, user);
  }

  @Post()
  async create(@Body() createSaleDto: CreateSaleDto, @CurrentUser() user) {
    return this.salesService.create(createSaleDto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
    @CurrentUser() user,
  ) {
    return this.salesService.update(id, updateSaleDto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user) {
    return this.salesService.remove(id, user);
  }
}
```

---

## 🔧 Ejemplos de Services

### Auth Service

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LogsService } from '../logs/logs.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logsService: LogsService,
  ) {}

  async login(loginDto: { username: string; password: string }, metadata: any) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: loginDto.username },
          { email: loginDto.username },
        ],
        deletedAt: null,
      },
    });

    // Log intento de login
    await this.prisma.loginAttempt.create({
      data: {
        username: loginDto.username,
        success: false,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está bloqueado
    if (user.isLocked) {
      await this.notifyCoordinatorAccountLocked(user.id);
      throw new UnauthorizedException('Cuenta bloqueada. Contacta a tu coordinador.');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      const failedAttempts = user.failedLoginAttempts + 1;
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          ...(failedAttempts >= 5 && {
            isLocked: true,
            lockedAt: new Date(),
          }),
        },
      });

      if (failedAttempts >= 5) {
        await this.notifyCoordinatorAccountLocked(user.id);
      }

      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar sesión activa en otro dispositivo
    if (user.currentSessionToken && user.role !== 'developer' && user.role !== 'gerencia') {
      await this.handleSessionConflict(user.id, metadata);
    }

    // Resetear intentos fallidos
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLogin: new Date(),
      },
    });

    // Actualizar login attempt
    await this.prisma.loginAttempt.updateMany({
      where: {
        username: loginDto.username,
        success: false,
      },
      data: { success: true },
    });

    // Log login exitoso
    await this.logsService.create({
      userId: user.id,
      action: 'login',
      description: 'Usuario inició sesión',
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Generar tokens
    const tokens = await this.generateTokens(user);

    // Guardar sesión
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        currentSessionToken: tokens.accessToken,
        currentDeviceInfo: metadata,
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      requiresTwoFactor: user.twoFactorEnabled,
      requiresPasswordChange: user.mustChangePassword,
    };
  }

  async verify2FA(token: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    return { success: true };
  }

  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const secret = speakeasy.generateSecret({
      name: `GoodCall (${user.username})`,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    return { qrCode, secret: secret.base32 };
  }

  async changePassword(userId: string, dto: { oldPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);

    if (!isOldPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    await this.logsService.create({
      userId: userId,
      action: 'change_password',
      description: 'Usuario cambió su contraseña',
    });

    return { success: true };
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, username: user.username, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  private async handleSessionConflict(userId: string, newMetadata: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.prisma.sessionConflict.create({
      data: {
        userId: userId,
        oldDeviceInfo: user.currentDeviceInfo as any,
        oldIpAddress: (user.currentDeviceInfo as any)?.ipAddress,
        newDeviceInfo: newMetadata,
        newIpAddress: newMetadata.ipAddress,
      },
    });

    // Notificar sesión anterior
    await this.prisma.notification.create({
      data: {
        userId: userId,
        type: 'session_conflict',
        title: 'Nueva sesión detectada',
        message: 'Tu sesión anterior ha sido cerrada porque iniciaste sesión en otro dispositivo.',
      },
    });
  }

  private async notifyCoordinatorAccountLocked(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { coordinator: true },
    });

    if (user.coordinator) {
      await this.prisma.notification.create({
        data: {
          userId: user.coordinator.id,
          type: 'account_locked',
          title: 'Cuenta de asesor bloqueada',
          message: `La cuenta de ${user.firstName} ${user.lastName} ha sido bloqueada por múltiples intentos fallidos.`,
          relatedEntityType: 'user',
          relatedEntityId: user.id,
        },
      });
    }
  }
}
```

---

## 🛡️ Ejemplos de Guards y Decorators

### Roles Guard

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Custom Decorators

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## ⚛️ Componentes React Clave

### Login Form

```typescript
// features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { login, verify2FA, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data);
    
    if (result.requiresTwoFactor) {
      setShow2FA(true);
    }
  };

  const handleVerify2FA = async () => {
    await verify2FA(twoFactorCode);
  };

  if (show2FA) {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="2fa">Código de Autenticación</Label>
          <Input
            id="2fa"
            type="text"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="000000"
          />
        </div>
        <Button onClick={handleVerify2FA} disabled={isLoading} className="w-full">
          Verificar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="username">Usuario o Email</Label>
        <Input
          id="username"
          {...register('username')}
          placeholder="tu.usuario"
        />
        {errors.username && (
          <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </form>
  );
}
```

### Sales Table

```typescript
// features/sales/components/SalesTable.tsx
import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useSalesStore } from '@/stores/salesStore';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function SalesTable() {
  const { sales, deleteSale } = useSalesStore();
  const { canEdit, canDelete } = usePermissions();

  const columns = useMemo(() => [
    {
      accessorKey: 'saleDate',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.saleDate).toLocaleDateString(),
    },
    {
      accessorKey: 'clientName',
      header: 'Cliente',
    },
    {
      accessorKey: 'clientDni',
      header: 'DNI',
    },
    {
      accessorKey: 'company.name',
      header: 'Compañía',
    },
    {
      accessorKey: 'asesor.firstName',
      header: 'Asesor',
      cell: ({ row }) => `${row.original.asesor.firstName} ${row.original.asesor.lastName}`,
    },
    {
      accessorKey: 'saleStatus.name',
      header: 'Estado',
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <span>{row.original.saleStatus?.icon}</span>
          <span>{row.original.saleStatus?.name}</span>
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm">
              Editar
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteSale(row.original.id)}
            >
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ], [canEdit, canDelete]);

  const table = useReactTable({
    data: sales,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
```

---

## 🪝 Custom Hooks

### usePermissions

```typescript
// hooks/usePermissions.ts
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/user.types';

export function usePermissions() {
  const { user } = useAuthStore();

  const canViewAllSales = user?.role === 'developer' || user?.role === 'gerencia';
  const canViewTeamSales = user?.role === 'coordinador' || canViewAllSales;
  const canEditSales = user?.role !== 'asesor';
  const canDeleteSales = user?.role !== 'asesor';
  const canCreateUsers = user?.role === 'developer' || user?.role === 'gerencia';
  const canManageSettings = user?.role === 'developer';
  const canViewLogs = user?.role !== 'asesor';

  return {
    canViewAllSales,
    canViewTeamSales,
    canEditSales,
    canDeleteSales,
    canCreateUsers,
    canManageSettings,
    canViewLogs,
  };
}
```

### useDebounce

```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 🗂️ Zustand Stores

### Auth Store

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';
import { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  verify2FA: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', credentials);
          const { user, accessToken, refreshToken, requiresTwoFactor, requiresPasswordChange } = response.data;

          set({
            user,
            accessToken,
            refreshToken,
          });

          return response.data;
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verify2FA: async (code) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/verify-2fa', { token: code });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },

      changePassword: async (oldPassword, newPassword) => {
        await api.post('/auth/change-password', { oldPassword, newPassword });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
```

### Sales Store

```typescript
// stores/salesStore.ts
import { create } from 'zustand';
import api from '@/services/api';
import { Sale } from '@/types/sale.types';

interface SalesState {
  sales: Sale[];
  isLoading: boolean;
  fetchSales: (filters?: any) => Promise<void>;
  createSale: (data: any) => Promise<void>;
  updateSale: (id: string, data: any) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set) => ({
  sales: [],
  isLoading: false,

  fetchSales: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/sales', { params: filters });
      set({ sales: response.data });
    } finally {
      set({ isLoading: false });
    }
  },

  createSale: async (data) => {
    const response = await api.post('/sales', data);
    set((state) => ({ sales: [...state.sales, response.data] }));
  },

  updateSale: async (id, data) => {
    const response = await api.patch(`/sales/${id}`, data);
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === id ? response.data : sale
      ),
    }));
  },

  deleteSale: async (id) => {
    await api.delete(`/sales/${id}`);
    set((state) => ({
      sales: state.sales.filter((sale) => sale.id !== id),
    }));
  },
}));
```

---

## 🎨 Configuración de Tailwind

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

## 🚀 Implementaciones Prácticas de Mejoras

### 1. Configuración de TanStack Query (React Query)

#### Instalación

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

#### Setup en App.tsx

```typescript
// app/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Tu app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### Hooks de Sales con React Query

```typescript
// features/sales/hooks/useSales.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Sale, CreateSaleDto, UpdateSaleDto } from '@/types/sale.types';

// GET - Listar ventas
export function useSales(filters = {}) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      const { data } = await api.get<Sale[]>('/sales', { params: filters });
      return data;
    },
  });
}

// GET - Obtener una venta
export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: async () => {
      const { data } = await api.get<Sale>(`/sales/${id}`);
      return data;
    },
    enabled: !!id, // Solo ejecutar si hay ID
  });
}

// POST - Crear venta
export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newSale: CreateSaleDto) => {
      const { data } = await api.post<Sale>('/sales', newSale);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}

// PATCH - Actualizar venta
export function useUpdateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSaleDto }) => {
      const response = await api.patch<Sale>(`/sales/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', variables.id] });
    },
  });
}

// DELETE - Eliminar venta
export function useDeleteSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}

// GET - Estadísticas
export function useSalesStats(filters = {}) {
  return useQuery({
    queryKey: ['sales', 'stats', filters],
    queryFn: async () => {
      const { data } = await api.get('/sales/stats', { params: filters });
      return data;
    },
  });
}
```

#### Uso en Componentes

```typescript
// features/sales/pages/SalesListPage.tsx
import { useSales, useDeleteSale } from '../hooks/useSales';
import { SalesTable } from '../components/SalesTable';
import { Button } from '@/components/ui/button';

export function SalesListPage() {
  const [filters, setFilters] = useState({});
  const { data: sales, isLoading, isError, error } = useSales(filters);
  const deleteSale = useDeleteSale();

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  const handleDelete = async (id: string) => {
    await deleteSale.mutateAsync(id);
  };

  return (
    <div>
      <h1>Ventas</h1>
      <SalesTable 
        sales={sales} 
        onDelete={handleDelete}
        isDeleting={deleteSale.isPending}
      />
    </div>
  );
}
```

---

### 2. Prisma Service con Middleware de Soft Deletes

```typescript
// database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    
    // Middleware para soft deletes automáticos
    this.$use(async (params, next) => {
      // Convertir DELETE en UPDATE con deletedAt
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
        // Cambiar findUnique a findFirst para poder usar where
        params.action = 'findFirst';
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }
      
      if (params.action === 'findMany') {
        // Solo agregar filtro si no se especificó deletedAt explícitamente
        if (params.args.where) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where['deletedAt'] = null;
          }
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }
      
      // Actualizar también en count
      if (params.action === 'count') {
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

  async onModuleDestroy() {
    await this.$disconnect();
  }
  
  // Método helper para incluir eliminados
  async findManyWithDeleted<T>(model: string, args?: any): Promise<T[]> {
    return this[model].findMany({
      ...args,
      where: {
        ...args?.where,
        // No filtrar por deletedAt
      },
    });
  }
  
  // Método para restaurar registros eliminados
  async restore(model: string, id: string) {
    return this[model].update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
```

#### Uso en Services

```typescript
// sales/sales.service.ts
@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // Automáticamente filtra deletedAt = null
  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        asesor: true,
        company: true,
        saleStatus: true,
      },
    });
  }

  // Para ver ventas eliminadas (solo gerencia/developer)
  async findAllWithDeleted() {
    return this.prisma.findManyWithDeleted('sale', {
      include: {
        asesor: true,
        company: true,
        saleStatus: true,
      },
    });
  }

  // Soft delete automático
  async remove(id: string) {
    // Esto ejecutará UPDATE sales SET deleted_at = NOW() WHERE id = ?
    return this.prisma.sale.delete({
      where: { id },
    });
  }

  // Restaurar venta eliminada
  async restore(id: string) {
    return this.prisma.restore('sale', id);
  }
}
```

---

### 3. Utilidad de Encriptación para 2FA

```typescript
// utils/encryption.util.ts
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly ivLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key || key.length !== 64) {
      throw new Error('ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retornar IV + encrypted separados por ':'
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### Uso en Auth Service

```typescript
// auth/auth.service.ts
import { EncryptionService } from '../utils/encryption.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private encryptionService: EncryptionService, // ✅ Inyectar
  ) {}

  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    const secret = speakeasy.generateSecret({
      name: `GoodCall (${user.username})`,
    });
    
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    // ✅ Encriptar antes de guardar
    const encryptedSecret = this.encryptionService.encrypt(secret.base32);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
      },
    });
    
    return { qrCode, secret: secret.base32 };
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA no está habilitado');
    }
    
    // ✅ Desencriptar para validar
    const decryptedSecret = this.encryptionService.decrypt(user.twoFactorSecret);
    
    return speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });
  }
}
```

---

### 4. Configuración de Validación Global

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ Validación global con seguridad
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Elimina propiedades no definidas en DTO
      forbidNonWhitelisted: true,    // Lanza error si hay propiedades extra
      transform: true,               // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  
  await app.listen(3000);
}
bootstrap();
```

---

### 5. Package.json Actualizado

#### Backend

```json
{
  "name": "goodcall-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/node": "^20.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^3.0.9",
    "@types/speakeasy": "^2.0.7",
    "@types/qrcode": "^1.5.2",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### Frontend

```json
{
  "name": "goodcall-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.9.0",
    "zustand": "^4.4.0",
    "axios": "^1.4.0",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.2.0",
    "zod": "^3.21.0",
    "framer-motion": "^10.12.0",
    "react-hot-toast": "^2.4.1",
    "next-themes": "^0.2.1",
    "@radix-ui/react-dialog": "^1.0.4",
    "@radix-ui/react-dropdown-menu": "^2.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^1.2.2",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "tailwindcss-animate": "^1.0.6",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "@tanstack/react-query-devtools": "^5.0.0"
  }
}
```

---

### 6. Variables de Entorno Actualizadas

```env
# Backend (.env)
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/goodcall"

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRATION=8h
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRATION=7d

# Encryption (para 2FA secrets) - NUEVO ⭐
ENCRYPTION_KEY=your-64-char-hex-key-here-32-bytes-in-hex

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

**Generar ENCRYPTION_KEY**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 Comandos de Instalación

### Backend

```bash
# Crear proyecto NestJS
npm i -g @nestjs/cli
nest new goodcall-backend

# Instalar dependencias
cd goodcall-backend
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/throttler
npm install @prisma/client bcrypt passport passport-jwt speakeasy qrcode winston
npm install -D prisma @types/bcrypt @types/passport-jwt @types/speakeasy @types/qrcode

# Inicializar Prisma
npx prisma init

# Después de configurar schema.prisma
npx prisma generate
npx prisma migrate dev --name init
```

### Frontend

```bash
# Crear proyecto Vite
npm create vite@latest goodcall-frontend -- --template react-ts

# Instalar dependencias
cd goodcall-frontend
npm install react-router-dom @tanstack/react-query @tanstack/react-table zustand
npm install axios react-hook-form @hookform/resolvers zod
npm install framer-motion react-hot-toast next-themes
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label
npm install @radix-ui/react-select @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge lucide-react

# Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
npx tailwindcss init -p

# DevTools
npm install -D @tanstack/react-query-devtools
```

---
