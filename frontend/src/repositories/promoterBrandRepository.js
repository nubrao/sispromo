import api from '../services/api';
import { message } from 'antd';

class PromoterBrandRepository {
    constructor() {
        this.baseURL = '/api/promoter-brands/';
    }

    // Busca todas as marcas dos promotores
    async getAllPromoterBrands() {
        try {
            const response = await api.get(this.baseURL, {
                timeout: 30000
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar marcas dos promotores:", error);
            message.error("Erro ao carregar marcas dos promotores");
            throw error;
        }
    }

    // Busca marcas de um promotor específico
    async getPromoterBrandsByPromoterId(promoterId) {
        try {
            const response = await api.get(
                `${this.baseURL}?promoter_id=${promoterId}`
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar marcas do promotor ${promoterId}:`, error);
            message.error("Erro ao carregar marcas do promotor");
            throw error;
        }
    }

    // Cria uma nova associação entre promotor e marca
    async createPromoterBrand(promoterId, brandId) {
        try {
            const response = await api.post(
                this.baseURL,
                {
                    promoter_id: promoterId,
                    brand_id: brandId
                },
                {
                    timeout: 30000
                }
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao associar marca ao promotor:", error);
            message.error("Erro ao associar marca ao promotor");
            throw error;
        }
    }

    // Remove uma associação entre promotor e marca
    async deletePromoterBrand(id) {
        try {
            await api.delete(`${this.baseURL}${id}/`, {
                timeout: 30000
            });
        } catch (error) {
            console.error("Erro ao remover marca do promotor:", error);
            message.error("Erro ao remover marca do promotor");
            throw error;
        }
    }
}

export default new PromoterBrandRepository(); 