import api from './api';

export interface Goal {
    id: string;
    targetUserId: string;
    year: number;
    month: number;
    targetSales: number;
    currentSales: number;
    createdAt: string;
}

export interface GoalsFilter {
    year?: number;
    month?: number;
    userId?: string;
}

const goalsService = {
    getAll: async (filter?: GoalsFilter) => {
        const params = new URLSearchParams();
        if (filter?.year) params.append('year', filter.year.toString());
        if (filter?.month) params.append('month', filter.month.toString());
        if (filter?.userId) params.append('userId', filter.userId);

        const response = await api.get<Goal[]>(`/goals?${params.toString()}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post<Goal>('/goals', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.patch<Goal>(`/goals/${id}`, data);
        return response.data;
    }
};

export default goalsService;
