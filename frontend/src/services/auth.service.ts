import api from './api';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'developer' | 'gerencia' | 'coordinador' | 'asesor';
    twoFactorEnabled: boolean;
    mustChangePassword?: boolean;
}

export interface LoginResponse {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    twoFactorRequired?: boolean;
    userId?: string;
}

const authService = {
    login: async (username: string, password: string, twoFactorCode?: string): Promise<LoginResponse> => {
        const response = await api.post('/auth/login', { username, password, twoFactorCode });
        const data = response.data as LoginResponse;

        // Guardar tokens si la respuesta incluye 2FA
        if (data.accessToken && data.refreshToken && !data.twoFactorRequired) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
        }

        // Guardar usuario
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    },

    generate2fa: async () => {
        const response = await api.post('/auth/2fa/generate');
        return response.data;
    },

    enable2fa: async (secret: string, token: string) => {
        const response = await api.post('/auth/2fa/enable', { secret, token });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    // Método para obtener el usuario actual
    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr) as User;
            } catch {
                return null;
            }
        }
        return null;
    },

    // Método para verificar si el usuario está autenticado
    isAuthenticated(): boolean {
        return !!localStorage.getItem('accessToken');
    },
};

export default authService;
