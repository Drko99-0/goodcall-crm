import api from './api';
import type { User, UserCreateInput, UserUpdateInput, UserRole } from '../types';

/**
 * Re-export User type for backward compatibility
 * @deprecated Import User from '../types' instead
 */
export type { User } from '../types';

const usersService = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    getAsesores: async (): Promise<User[]> => {
        // Obtener todos y filtrar por asesores y coordinadores
        const response = await api.get<User[]>('/users');
        return response.data.filter(u => u.role === 'asesor' || u.role === 'coordinador');
    },

    getById: async (id: string): Promise<User> => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: UserCreateInput): Promise<User> => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    update: async (id: string, data: UserUpdateInput): Promise<User> => {
        const response = await api.patch<User>(`/users/${id}`, data);
        return response.data;
    }
};

export default usersService;
