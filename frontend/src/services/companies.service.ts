import api from './api';

export interface Company {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    displayOrder: number;
}

const companiesService = {
    getAll: async () => {
        const response = await api.get<Company[]>('/companies');
        return response.data;
    },

    create: async (data: Omit<Company, 'id'>) => {
        const response = await api.post<Company>('/companies', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Company>) => {
        const response = await api.patch<Company>(`/companies/${id}`, data);
        return response.data;
    }
};

export default companiesService;
