const memoryCache = new Map();

class CacheService {
    constructor() {
        this.defaultTTL = 5 * 60 * 1000;
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

        memoryCache.set(cacheKey, cacheData);

        try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
        }
    }

    get(key) {
        const cacheKey = this.generateKey(key);

        const memoryData = memoryCache.get(cacheKey);
        if (memoryData) {
            if (Date.now() - memoryData.timestamp < memoryData.ttl) {
                return memoryData.data;
            }
            memoryCache.delete(cacheKey);
        }

        try {
            const localData = localStorage.getItem(cacheKey);
            if (localData) {
                const parsed = JSON.parse(localData);
                if (Date.now() - parsed.timestamp < parsed.ttl) {
                    memoryCache.set(cacheKey, parsed);
                    return parsed.data;
                }
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
        memoryCache.clear();

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        }
    }

    invalidate(key) {
        const cacheKey = this.generateKey(key);
        memoryCache.delete(cacheKey);
        localStorage.removeItem(cacheKey);
    }
}

export const cacheService = new CacheService();