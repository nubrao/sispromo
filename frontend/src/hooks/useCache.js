import { useState, useEffect } from 'react';
import api from '../services/api';
import { cacheService } from '../services/cacheService';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos
const DEFAULT_TIMEOUT = 30000; // 30 segundos

export const useCache = (url, params = {}, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const {
        ttl = 5 * 60 * 1000, // 5 minutos padrão
        forceRefresh = false, // Se true, ignora o cache
        onSuccess = null, // Callback após sucesso
        onError = null // Callback após erro
    } = options;

    const fetchData = async (retry = false) => {
        try {
            setLoading(true);
            setError(null);

            const cacheKey = `${url}${JSON.stringify(params)}`;

            // Se não forçar refresh, tenta buscar do cache
            if (!forceRefresh) {
                const cachedData = cacheService.get(cacheKey);
                if (cachedData) {
                    setData(cachedData);
                    setLoading(false);
                    onSuccess?.(cachedData);
                    return;
                }
            }

            // Se não encontrou no cache ou forçou refresh, faz a requisição
            const response = await api.get(url, {
                params,
                timeout: options.timeout || DEFAULT_TIMEOUT,
                ...options,
            });
            const responseData = response.data;

            // Salva no cache
            cacheService.set(cacheKey, responseData, ttl);

            setData(responseData);
            onSuccess?.(responseData);
        } catch (err) {
            console.error(`Erro ao buscar dados de ${url}:`, err);
            setError(err);
            onError?.(err);

            // Se ainda não atingiu o número máximo de tentativas e não é uma retry
            if (!retry && retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                // Tentar novamente após o delay
                setTimeout(() => {
                    fetchData(true);
                }, RETRY_DELAY);
            } else {
                // Se já tentou o máximo de vezes, usar dados do cache se disponível
                const cachedData = localStorage.getItem(url);
                if (cachedData) {
                    const { data: cachedResponse, timestamp } = JSON.parse(cachedData);
                    const isExpired = Date.now() - timestamp > options.ttl;

                    if (!isExpired) {
                        setData(cachedResponse);
                        setError(null);
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cachedData = localStorage.getItem(url);

        if (cachedData) {
            const { data: cachedResponse, timestamp } = JSON.parse(cachedData);
            const isExpired = Date.now() - timestamp > options.ttl;

            if (!isExpired) {
                setData(cachedResponse);
                setLoading(false);
            } else {
                fetchData();
            }
        } else {
            fetchData();
        }
    }, [url, JSON.stringify(params)]);

    // Função para forçar uma atualização
    const refresh = () => {
        return fetchData();
    };

    return { data, loading, error, refresh };
}; 