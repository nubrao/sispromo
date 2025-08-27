import api from '../services/api';
import brandRepository from './brandRepository';

const reportRepository = {
    getPromoters: async () => {
        const response = await api.get('/api/users/?role=1');
        return response.data;
    },

    getBrands: async () => {
        const response = await brandRepository.getAllBrands();
        const uniqueBrands = [...new Map(response.map(item => [item.brand_id, {
            value: item.brand_id,
            label: item.brand_name,
        }])).values()];

        return uniqueBrands;
    },

    getReport: async (params) => {
        try {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) =>
                    value !== null &&
                    value !== undefined &&
                    value !== ''
                )
            );

            console.log('Clean params before API call:', cleanParams);

            const response = await api.get('/api/visits/report/', {
                params: cleanParams
            });

            return response.data;
        } catch (error) {
            console.error('API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
                params: error.config?.params
            });
            throw error;
        }
    }
};

export default reportRepository;