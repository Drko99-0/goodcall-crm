import api from './api';
import type { Notification } from '../types';

/**
 * Re-export Notification type for backward compatibility
 * @deprecated Import from '../types' instead
 */
export type { Notification } from '../types';

const notificationsService = {
    getAll: async (): Promise<Notification[]> => {
        try {
            const response = await api.get<Notification[]>('/notifications');
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    markAsRead: async (id: string): Promise<Notification> => {
        try {
            const response = await api.patch<Notification>(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            console.error(`Error marking notification ${id} as read:`, error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/notifications/${id}`);
        } catch (error) {
            console.error(`Error deleting notification ${id}:`, error);
            throw error;
        }
    }
};

export default notificationsService;
