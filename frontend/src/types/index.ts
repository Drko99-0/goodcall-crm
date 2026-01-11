/**
 * Shared type definitions for the CRM application
 * Centralized types to avoid duplication and improve type safety
 */

// ============================================
// USER TYPES
// ============================================

/**
 * Combined User interface from auth.service.ts and users.service.ts
 * Includes all properties from both sources
 */
export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isLocked: boolean;
    twoFactorEnabled?: boolean;
    mustChangePassword?: boolean;
    coordinatorId?: string | null;
}

/**
 * User role types
 */
export type UserRole = 'developer' | 'gerencia' | 'coordinador' | 'asesor' | 'cerrador' | 'fidelizador';

/**
 * User creation/update payload
 */
export interface UserCreateInput {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    password?: string;
    coordinatorId?: string | null;
}

/**
 * User update payload
 */
export interface UserUpdateInput {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    password?: string;
    coordinatorId?: string | null;
    isActive?: boolean;
    isLocked?: boolean;
}

// ============================================
// SALE TYPES
// ============================================

/**
 * Sale interface with all related entities
 */
export interface Sale {
    id: string;
    asesorId: string;
    companyId?: string;
    saleStatusId?: string;
    saleDate: string;
    clientName?: string;
    clientDni?: string;
    clientPhone?: string;
    extraInfo?: string;
    address?: string;
    products?: SaleProduct[];
    createdAt: string;
    cerradorId?: string;
    fidelizadorId?: string;
    companySoldId?: string;
    technologyId?: string;
    saleStatus?: SaleStatus;
    company?: Company;
    companySold?: Company;
    technology?: Technology;
    asesor?: UserBasic;
    cerrador?: UserBasic;
    fidelizador?: UserBasic;
}

/**
 * Basic user info for nested objects
 */
export interface UserBasic {
    firstName: string;
    lastName: string;
    username?: string;
}

/**
 * Sale product interface
 */
export interface SaleProduct {
    id: string;
    name: string;
    price?: number;
    quantity?: number;
}

/**
 * Sale creation payload
 */
export interface SaleCreateInput {
    asesorId: string;
    companyId: string;
    companySoldId?: string | null;
    technologyId?: string | null;
    saleStatusId?: string | null;
    saleDate: string;
    clientName: string;
    clientDni: string;
    clientPhone: string;
    cerradorId?: string | null;
    fidelizadorId?: string | null;
    extraInfo?: string;
    address?: string;
    products?: SaleProduct[];
}

/**
 * Sale update payload
 * All fields from SaleCreateInput are optional
 */
export type SaleUpdateInput = Partial<SaleCreateInput>;

/**
 * Sales filter parameters
 */
export interface SalesFilter {
    asesorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

/**
 * Paginated sales response
 */
export interface SalesResponse {
    data: Sale[];
    total: number;
    page: number;
    limit: number;
}

// ============================================
// COMPANY TYPES
// ============================================

/**
 * Company interface
 */
export interface Company {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    displayOrder: number;
}

/**
 * Company creation payload
 */
export interface CompanyCreateInput {
    name: string;
    code: string;
    isActive?: boolean;
    displayOrder?: number;
}

/**
 * Company update payload
 */
export interface CompanyUpdateInput {
    name?: string;
    code?: string;
    isActive?: boolean;
    displayOrder?: number;
}

// ============================================
// SALE STATUS TYPES
// ============================================

/**
 * Sale status interface
 */
export interface SaleStatus {
    id: string;
    name: string;
    color: string;
    code: string;
    isActive?: boolean;
    displayOrder?: number;
}

// ============================================
// TECHNOLOGY TYPES
// ============================================

/**
 * Technology interface
 */
export interface Technology {
    id: string;
    name: string;
    code: string;
    isActive?: boolean;
    displayOrder?: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

/**
 * Notification interface
 */
export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string;
    createdAt: string;
}

// ============================================
// GOAL TYPES
// ============================================

/**
 * Goal interface
 */
export interface Goal {
    id: string;
    targetUserId: string;
    goalType?: 'individual' | 'global';
    year: number;
    month: number;
    targetSales: number;
    currentSales: number;
    createdAt: string;
}

/**
 * Goals filter parameters
 */
export interface GoalsFilter {
    year?: number;
    month?: number;
    userId?: string;
    goalType?: 'individual' | 'global';
}

/**
 * Goal creation payload
 */
export interface GoalCreateInput {
    targetUserId: string;
    goalType?: 'individual' | 'global';
    year: number;
    month: number;
    targetSales: number;
}

/**
 * Goal update payload
 */
export interface GoalUpdateInput {
    targetSales?: number;
    currentSales?: number;
}

// ============================================
// API ERROR TYPES
// ============================================

/**
 * Standard API error response
 */
export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
    details?: Record<string, string[]>;
}

/**
 * Response wrapper for API errors
 */
export interface ApiErrorResponse {
    data: ApiError;
    status: number;
}

// ============================================
// WEBSOCKET TYPES
// ============================================

/**
 * WebSocket event types
 */
export type WebSocketEventType =
    | 'notification'
    | 'notification_read'
    | 'notification_deleted'
    | 'all_notifications_read'
    | 'sale_update'
    | 'goal_update'
    | 'user_update'
    | 'system_event'
    | 'connected'
    | 'error'
    | 'room-joined'
    | 'room-left'
    | 'stats';

/**
 * WebSocket notification payload
 */
export interface WebSocketNotification {
    id?: string;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string;
    isRead?: boolean;
    createdAt?: Date;
    event?: string;
    notificationId?: string;
    unreadCount?: number;
    count?: number;
}

/**
 * WebSocket sale update payload
 */
export interface SaleUpdatePayload {
    event: 'sale_update';
    action: 'created' | 'updated' | 'deleted';
    data: Sale;
    timestamp: Date;
}

/**
 * WebSocket goal update payload
 */
export interface GoalUpdatePayload {
    event: 'goal_update';
    action: 'created' | 'updated' | 'deleted';
    data: Goal;
    timestamp: Date;
}

/**
 * WebSocket user update payload
 */
export interface UserUpdatePayload {
    event: 'user_update';
    action: 'created' | 'updated' | 'deleted';
    data: User;
    timestamp: Date;
}

/**
 * WebSocket system event payload
 */
export interface SystemEventPayload {
    event: 'system_event';
    type: string;
    message: string;
    data?: Record<string, unknown>;
    timestamp: Date;
}

/**
 * WebSocket connection options
 */
export interface WebSocketConnectOptions {
    userId?: string;
    token?: string;
    autoConnect?: boolean;
}

/**
 * WebSocket connection status
 */
export interface WebSocketConnectionStats {
    connected: boolean;
    rooms: string[];
    uptime: number;
    messagesSent: number;
    messagesReceived: number;
}

// ============================================
// AUTH TYPES
// ============================================

/**
 * Login response from authentication service
 */
export interface LoginResponse {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    twoFactorRequired?: boolean;
    userId?: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
    username: string;
    password: string;
    twoFactorCode?: string;
}

/**
 * 2FA setup response
 */
export interface TwoFactorSetupResponse {
    secret: string;
    qrCode: string;
    backupCodes?: string[];
}

// ============================================
// DASHBOARD TYPES
// ============================================

/**
 * Chart data point
 */
export interface ChartDataPoint {
    date: string;
    value: number;
    label?: string;
}

/**
 * Sales by status data
 */
export interface SalesByStatus {
    status: string;
    count: number;
    color: string;
}

/**
 * Performance data for advisors
 */
export interface PerformanceData {
    asesor: string;
    ventas: number;
    meta: number;
    progreso: number;
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
    totalSales: number;
    salesGrowth: number;
    activeSales: number;
    conversionRate: number;
    goalProgress: number;
    totalSalesThisMonth: number;
    totalSalesLastMonth: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Optional fields - makes all properties optional
 */
export type Optional<T> = {
    [P in keyof T]?: T[P];
};

/**
 * Nullable fields - makes all properties nullable
 */
export type Nullable<T> = {
    [P in keyof T]: T[P] | null;
};

/**
 * ID type for better type safety
 */
export type ID = string;

/**
 * Date string type
 */
export type DateString = string;
