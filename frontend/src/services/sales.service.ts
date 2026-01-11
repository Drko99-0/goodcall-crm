import api from './api';
import type {
    Sale,
    SalesFilter,
    SaleCreateInput,
    SaleUpdateInput,
    SalesResponse,
} from '../types';

/**
 * Re-export Sale type for backward compatibility
 * @deprecated Import Sale from '../types' instead
 */
export type { Sale, SalesFilter } from '../types';

const salesService = {
    getAll: async (filter?: SalesFilter): Promise<Sale[] | SalesResponse> => {
        const params = new URLSearchParams();
        if (filter?.asesorId) params.append('asesorId', filter.asesorId);
        if (filter?.startDate) params.append('startDate', filter.startDate);
        if (filter?.endDate) params.append('endDate', filter.endDate);
        if (filter?.page) params.append('page', filter.page.toString());
        if (filter?.limit) params.append('limit', filter.limit.toString());

        const response = await api.get<Sale[] | SalesResponse>(`/sales?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<Sale> => {
        const response = await api.get<Sale>(`/sales/${id}`);
        return response.data;
    },

    create: async (data: SaleCreateInput): Promise<Sale> => {
        const response = await api.post<Sale>('/sales', data);
        return response.data;
    },

    update: async (id: string, data: Partial<SaleCreateInput>): Promise<Sale> => {
        const response = await api.patch<Sale>(`/sales/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/sales/${id}`);
    }
};

export default salesService;
