const memoryCache = new Map();

class CacheService {
    constructor() {
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos em milissegundos
        this.prefix = '@SisPromo:cache:';
    }

    generateKey(key) {
        return this.prefix + key;
    }

    set(key, data, ttl = this.defaultTTL) {
        const cacheKey = this.generateKey(key);
        const cacheData = {
            data,
            timestamp: Date.now(),
            ttl
        };

        // Salva em memória
        memoryCache.set(cacheKey, cacheData);

        // Salva no localStorage
        try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
        }
    }

    get(key) {
        const cacheKey = this.generateKey(key);

        // Tenta primeiro da memória
        const memoryData = memoryCache.get(cacheKey);
        if (memoryData) {
            if (Date.now() - memoryData.timestamp < memoryData.ttl) {
                return memoryData.data;
            }
            memoryCache.delete(cacheKey);
        }

        // Se não encontrou na memória, tenta do localStorage
        try {
            const localData = localStorage.getItem(cacheKey);
            if (localData) {
                const parsed = JSON.parse(localData);
                if (Date.now() - parsed.timestamp < parsed.ttl) {
                    // Atualiza a memória
                    memoryCache.set(cacheKey, parsed);
                    return parsed.data;
                }
                // Se expirou, remove
                localStorage.removeItem(cacheKey);
            }
        } catch (error) {
            console.warn('Erro ao ler do localStorage:', error);
        }

        return null;
    }

    remove(key) {
        const cacheKey = this.generateKey(key);
        memoryCache.delete(cacheKey);
        localStorage.removeItem(cacheKey);
    }

    clear() {
        // Limpa a memória
        memoryCache.clear();

        // Limpa apenas as chaves do cache no localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        }
    }
}

export const cacheService = new CacheService(); 