import { useEffect, useState } from 'react';
import api from '../services/api';

export function useCancelableAxios(config) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);

        api.request({ ...config, signal: controller.signal })
            .then(res => setData(res.data))
            .catch(err => {
                if (err.code !== 'ERR_CANCELED' && err.name !== 'CanceledError') setError(err);
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [JSON.stringify(config)]);

    return { data, error, loading };
}