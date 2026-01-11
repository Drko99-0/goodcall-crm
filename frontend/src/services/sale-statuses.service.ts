import api from './api';

export interface SaleStatus {
    id: string;
    name: string;
    code: string;
    color: string;
    isActiveStatus: boolean;
    isFinal: boolean;
    displayOrder: number;
}

const saleStatusesService = {
    getAll: async () => {
        const response = await api.get<SaleStatus[]>('/sale-statuses');
        return response.data;
    },

    create: async (data: Omit<SaleStatus, 'id'>) => {
        const response = await api.post<SaleStatus>('/sale-statuses', data);
        return response.data;
    },

    update: async (id: string, data: Partial<SaleStatus>) => {
        const response = await api.patch<SaleStatus>(`/sale-statuses/${id}`, data);
        return response.data;
    }
};

export default saleStatusesService;
