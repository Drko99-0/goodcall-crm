import api from './api';

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    entityId?: string;
    entityType?: string;
    description?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    user?: {
        username: string;
        firstName: string;
        lastName: string;
    };
}

export interface LogsFilter {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

const logsService = {
    getAll: async (filter?: LogsFilter) => {
        const params = new URLSearchParams();
        if (filter?.userId) params.append('userId', filter.userId);
        if (filter?.action) params.append('action', filter.action);
        if (filter?.startDate) params.append('startDate', filter.startDate);
        if (filter?.endDate) params.append('endDate', filter.endDate);
        if (filter?.page) params.append('page', filter.page.toString());
        if (filter?.limit) params.append('limit', filter.limit.toString());

        const response = await api.get<AuditLog[]>(`/logs?${params.toString()}`);
        return response.data;
    }
};

export default logsService;
