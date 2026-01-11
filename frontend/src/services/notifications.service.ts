import api from './api';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: string;
    actionUrl?: string;
    createdAt: string;
}

const notificationsService = {
    getAll: async () => {
        const response = await api.get<Notification[]>('/notifications');
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.patch<Notification>(`/notifications/${id}/read`);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    }
};

export default notificationsService;
