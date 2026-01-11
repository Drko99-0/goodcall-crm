import { useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Tipos de datos para gráficos
 */
export interface ChartDataPoint {
    date: string;
    value: number;
    label?: string;
}

export interface SalesByStatus {
    status: string;
    count: number;
    color: string;
}

export interface PerformanceData {
    asesor: string;
    ventas: number;
    meta: number;
    progreso: number;
}

/**
 * Servicios de utilidad para dashboard y gráficos
 */

/**
 * Genera datos para gráfico de ventas por día
 */
export function generateDailySalesData(sales: any[], days: number = 30): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const endDate = endOfDay(date);

        const count = sales.filter(sale => {
            const saleDate = new Date(sale.saleDate);
            return saleDate >= date && saleDate <= endDate;
        }).length;

        data.push({
            date: format(date, 'dd/MM'),
            value: count,
            label: format(date, 'dd MMM'),
        });
    }

    return data;
}

/**
 * Genera datos para gráfico de ventas por estado
 */
export function generateSalesByStatusData(sales: any[]): SalesByStatus[] {
    const statusColors: Record<string, string> = {
        'Vendido': '#10b981',      // green
        'En Proceso': '#f59e0b',    // amber
        'Perdido': '#ef4444',       // red
        'Pendiente': '#6b7280',     // gray
        'Contactado': '#3b82f6',    // blue
    };

    const statusMap = new Map<string, number>();

    sales.forEach(sale => {
        const statusName = sale.saleStatus?.name || 'Sin Estado';
        statusMap.set(statusName, (statusMap.get(statusName) || 0) + 1);
    });

    return Array.from(statusMap.entries())
        .map(([status, count]) => ({
            status,
            count,
            color: statusColors[status] || '#8b5cf6',
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Genera datos para gráfico de rendimiento de asesores
 */
export function generatePerformanceData(
    sales: any[],
    goals: any[],
    asesorNameMap: Map<string, string>
): PerformanceData[] {
    const asesorSales = new Map<string, number>();
    const asesorGoals = new Map<string, number>();

    // Contar ventas por asesor
    sales.forEach(sale => {
        const asesorId = sale.asesorId;
        asesorSales.set(asesorId, (asesorSales.get(asesorId) || 0) + 1);
    });

    // Obtener metas por asesor
    goals.forEach(goal => {
        if (goal.targetUserId) {
            asesorGoals.set(goal.targetUserId, goal.targetSales);
        }
    });

    // Combinar datos
    const allAsesors = new Set([
        ...asesorSales.keys(),
        ...asesorGoals.keys(),
    ]);

    return Array.from(allAsesors).map(asesorId => {
        const ventas = asesorSales.get(asesorId) || 0;
        const meta = asesorGoals.get(asesorId) || 0;
        const progreso = meta > 0 ? Math.min(100, (ventas / meta) * 100) : 0;

        return {
            asesor: asesorNameMap.get(asesorId) || `Asesor ${asesorId.slice(0, 4)}`,
            ventas,
            meta,
            progreso: Math.round(progreso),
        };
    }).sort((a, b) => b.ventas - a.ventas);
}

/**
 * Genera datos para gráfico de ventas por compañía
 */
export function generateSalesByCompanyData(sales: any[]): { name: string; value: number; color: string }[] {
    const companyMap = new Map<string, number>();

    sales.forEach(sale => {
        const companyName = sale.company?.name || 'Sin Compañía';
        companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1);
    });

    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#14b8a6', // teal
        '#f97316', // orange
    ];

    return Array.from(companyMap.entries())
        .map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length],
        }))
        .sort((a, b) => b.value - a.value);
}

/**
 * Calcula métricas del dashboard
 */
export function calculateDashboardMetrics(sales: any[], goals: any[]) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Ventas este mes
    const salesThisMonth = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= startOfMonth && saleDate <= today;
    }).length;

    // Ventas mes pasado
    const salesLastMonth = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth;
    }).length;

    // Crecimiento
    const growth = salesLastMonth > 0
        ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100
        : 0;

    // Ventas activas
    const activeSales = sales.filter(sale => sale.isActive).length;

    // Meta global
    const globalGoal = goals.find(g => g.goalType === 'global');
    const goalProgress = globalGoal
        ? Math.min(100, (salesThisMonth / globalGoal.targetSales) * 100)
        : 0;

    // Tasa de conversión (ventas activas / total)
    const conversionRate = sales.length > 0
        ? (activeSales / sales.length) * 100
        : 0;

    return {
        totalSales: salesThisMonth,
        salesGrowth: Math.round(growth * 10) / 10,
        activeSales,
        conversionRate: Math.round(conversionRate * 10) / 10,
        goalProgress: Math.round(goalProgress * 10) / 10,
        totalSalesThisMonth: salesThisMonth,
        totalSalesLastMonth: salesLastMonth,
    };
}

/**
 * Hook personalizado para datos del dashboard
 */
export function useDashboardData(sales: any[], goals: any[], users: any[]) {
    return useMemo(() => {
        // Crear mapa de nombres de asesores
        const asesorNameMap = new Map<string, string>();
        users.forEach(user => {
            asesorNameMap.set(user.id, `${user.firstName} ${user.lastName}`.trim() || user.username);
        });

        return {
            dailySales: generateDailySalesData(sales, 30),
            salesByStatus: generateSalesByStatusData(sales),
            performance: generatePerformanceData(sales, goals, asesorNameMap),
            salesByCompany: generateSalesByCompanyData(sales),
            metrics: calculateDashboardMetrics(sales, goals),
        };
    }, [sales, goals, users]);
}

/**
 * Hook para datos de un asesor específico
 */
export function useAsesorDashboardData(asesorId: string, sales: any[], goals: any[]) {
    return useMemo(() => {
        const asesorSales = sales.filter(s => s.asesorId === asesorId);
        const asesorGoal = goals.find(g => g.targetUserId === asesorId);

        const dailySales = generateDailySalesData(asesorSales, 30);
        const salesByStatus = generateSalesByStatusData(asesorSales);

        const thisMonth = asesorSales.filter(s => {
            const saleDate = new Date(s.saleDate);
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            return saleDate >= startOfMonth;
        }).length;

        const goalTarget = asesorGoal?.targetSales || 0;
        const progress = goalTarget > 0 ? Math.min(100, (thisMonth / goalTarget) * 100) : 0;

        return {
            dailySales,
            salesByStatus,
            thisMonth,
            goalTarget,
            progress: Math.round(progress),
        };
    }, [asesorId, sales, goals]);
}
