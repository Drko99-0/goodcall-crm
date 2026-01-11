import api from './api';

export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    isLocked: boolean;
    coordinatorId?: string | null;
}

const usersService = {
    getAll: async () => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    getAsesores: async () => {
        // Por ahora obtenemos todos y filtramos, o si tuviéramos endpoint específico
        const response = await api.get<User[]>('/users');
        return response.data.filter(u => u.role === 'asesor' || u.role === 'coordinador');
    },

    getById: async (id: string) => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.patch<User>(`/users/${id}`, data);
        return response.data;
    }
};

export default usersService;
