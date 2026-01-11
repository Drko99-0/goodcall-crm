import api from './api';
import type { Goal, GoalsFilter, GoalCreateInput, GoalUpdateInput } from '../types';

/**
 * Re-export Goal type for backward compatibility
 * @deprecated Import from '../types' instead
 */
export type { Goal, GoalsFilter } from '../types';

const goalsService = {
    getAll: async (filter?: GoalsFilter): Promise<Goal[]> => {
        try {
            const params = new URLSearchParams();
            if (filter?.year) params.append('year', filter.year.toString());
            if (filter?.month) params.append('month', filter.month.toString());
            if (filter?.userId) params.append('userId', filter.userId);
            if (filter?.goalType) params.append('goalType', filter.goalType);

            const response = await api.get<Goal[]>(`/goals?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching goals:', error);
            throw error;
        }
    },

    create: async (data: GoalCreateInput): Promise<Goal> => {
        try {
            const response = await api.post<Goal>('/goals', data);
            return response.data;
        } catch (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
    },

    update: async (id: string, data: GoalUpdateInput): Promise<Goal> => {
        try {
            const response = await api.patch<Goal>(`/goals/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating goal ${id}:`, error);
            throw error;
        }
    }
};

export default goalsService;
