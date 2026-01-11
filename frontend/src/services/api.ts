import axios, { AxiosError } from 'axios';

/**
 * Navigation callback type
 * Use setNavigateCallback to inject the navigate function from React Router
 */
type NavigateFunction = (path: string, options?: { replace?: boolean }) => void;
let navigateCallback: NavigateFunction | null = null;

/**
 * Set the navigate function to be used for redirects
 * Call this from your Router component or App root
 */
export function setNavigateCallback(navigate: NavigateFunction) {
    navigateCallback = navigate;
}

/**
 * Internal function to perform navigation
 * Falls back to window.location if navigate callback is not set
 */
function performNavigation(path: string, replace = false) {
    if (navigateCallback) {
        navigateCallback(path, { replace });
    } else {
        // Fallback to window.location if navigate callback not set
        if (replace) {
            window.location.replace(path);
        } else {
            window.location.href = path;
        }
    }
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://backend-production-6ce5a.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag para prevenir múltiples intentos de refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: string) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token || '');
        }
    });
    failedQueue = [];
};

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para manejar errores y refresh token
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Si el error es 401 y no hemos intentado refresh aún
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Si estamos en el endpoint de login, no intentar refresh
            if (originalRequest.url?.includes('/auth/login')) {
                // Limpiar todo y redirigir a login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    performNavigation('/login', true);
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Si ya estamos refrescando, agregar la petición a la cola
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                // No hay refresh token, limpiar y redirigir
                processQueue(error, null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    performNavigation('/login', true);
                }
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                // Intentar refresh el token
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'https://backend-production-6ce5a.up.railway.app/api'}/auth/refresh`,
                    { refreshToken }
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Guardar los nuevos tokens
                localStorage.setItem('accessToken', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Actualizar el header de la petición original
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Procesar la cola de peticiones pendientes
                processQueue(null, accessToken);

                // Reintentar la petición original
                return api(originalRequest);
            } catch (refreshError) {
                // El refresh falló, limpiar todo y redirigir
                processQueue(refreshError, null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    performNavigation('/login', true);
                }
                isRefreshing = false;
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
