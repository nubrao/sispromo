import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('@SisPromo:token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se o erro for 401 (Unauthorized) e não for uma tentativa de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('@SisPromo:refresh');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Tenta renovar o token
                const response = await api.post('/api/auth/refresh/', {
                    refresh: refreshToken,
                });

                const { access: newToken } = response.data;

                // Atualiza o token no localStorage
                localStorage.setItem('@SisPromo:token', newToken);

                // Atualiza o token no header da requisição original
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Refaz a requisição original com o novo token
                return api(originalRequest);
            } catch (refreshError) {
                // Se não conseguir renovar o token, limpa o storage e redireciona para login
                localStorage.removeItem('@SisPromo:user');
                localStorage.removeItem('@SisPromo:token');
                localStorage.removeItem('@SisPromo:refresh');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api; 