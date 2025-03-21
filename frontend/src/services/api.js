import axios from 'axios';
import { Toast } from '../components/Toast';

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
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratar erros de token expirado
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se o erro for de token inválido/expirado e ainda não tentamos renovar
        if (error.response?.data?.code === 'token_not_valid' && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Tenta renovar o token usando o refresh token
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`${API_URL}/api/token/refresh/`, {
                    refresh: refreshToken
                });

                // Se conseguiu renovar, atualiza o token e refaz a requisição original
                if (response.data.access) {
                    localStorage.setItem('token', response.data.access);
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Se não conseguiu renovar, limpa os tokens e redireciona para login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                Toast.showToast('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
            }
        }

        return Promise.reject(error);
    }
);

export default api; 