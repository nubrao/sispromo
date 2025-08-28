import axios from 'axios';
import { Toast } from '../components/Toast';
import { cacheService } from './cacheService';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // Aumentando o timeout para 30 segundos
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cache TTL por endpoint (em milissegundos)
const CACHE_TTL = {
    '/api/promoter-brands/': 5 * 60 * 1000, // 5 minutos
    '/api/stores/': 30 * 60 * 1000, // 30 minutos
    '/api/brands/': 30 * 60 * 1000, // 30 minutos
    '/api/states/': 24 * 60 * 60 * 1000, // 24 horas
};

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
    (config) => {
        // Se for GET, tenta buscar do cache
        if (config.method === 'get') {
            const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
            const cachedData = cacheService.get(cacheKey);
            if (cachedData) {
                // Se encontrou no cache, cancela a requisição
                config.adapter = () => {
                    return Promise.resolve({
                        data: cachedData,
                        status: 200,
                        statusText: 'OK',
                        headers: config.headers,
                        config: config,
                        request: null
                    });
                };
            }
        }

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

// Interceptor para tratar erros de token expirado e cachear respostas
api.interceptors.response.use(
    (response) => {
        // Se for GET, salva no cache
        if (response.config.method === 'get') {
            const url = response.config.url;
            const ttl = CACHE_TTL[url] || 5 * 60 * 1000; // 5 minutos padrão
            const cacheKey = `${url}${JSON.stringify(response.config.params || {})}`;
            cacheService.set(cacheKey, response.data, ttl);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Se o erro for de token inválido/expirado e ainda não tentamos renovar
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Tenta renovar o token usando o refresh token
                const refreshToken = localStorage.getItem('@SisPromo:refresh');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_URL}/api/token/refresh/`, {
                    refresh: refreshToken
                });

                // Se conseguiu renovar, atualiza o token e refaz a requisição original
                if (response.data.access) {
                    localStorage.setItem('@SisPromo:token', response.data.access);
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Se não conseguiu renovar, limpa os tokens e redireciona para login
                localStorage.removeItem('@SisPromo:token');
                localStorage.removeItem('@SisPromo:refresh');
                cacheService.clear(); // Limpa o cache ao fazer logout
                window.location.href = '/login';
                Toast.showToast('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
            }
        } else if (error.code === 'ECONNABORTED' && !originalRequest._retryCount) {
            originalRequest._retryCount = 1;

            console.warn(`Tentativa ${originalRequest._retryCount}/3: Requisição excedeu o tempo limite`);

            await new Promise(resolve => setTimeout(resolve, 2000));

            return api.request(originalRequest);
        } else if (error.code === 'ECONNABORTED' && originalRequest._retryCount < 3) {
            originalRequest._retryCount++;

            console.warn(`Tentativa ${originalRequest._retryCount}/3: Requisição excedeu o tempo limite`);

            await new Promise(resolve => setTimeout(resolve, 2000 * originalRequest._retryCount));

            return api.request(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default api;