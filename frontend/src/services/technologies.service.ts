import api from './api';

export interface Technology {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    displayOrder: number;
}

const technologiesService = {
    getAll: async () => {
        const response = await api.get<Technology[]>('/technologies');
        return response.data;
    },

    create: async (data: Omit<Technology, 'id'>) => {
        const response = await api.post<Technology>('/technologies', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Technology>) => {
        const response = await api.patch<Technology>(`/technologies/${id}`, data);
        return response.data;
    }
};

export default technologiesService;
