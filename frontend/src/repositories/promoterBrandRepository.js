import api from '../services/api';
import { Toast } from '../components/Toast';

class PromoterBrandRepository {
    constructor() {
        this.baseURL = '/api/promoter-brands/';
    }

    // Busca todas as marcas dos promotores
    async getAllPromoterBrands() {
        try {
            const response = await api.get(this.baseURL);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar marcas dos promotores:", error);
            Toast.showToast("Erro ao carregar marcas dos promotores", "error");
            throw error;
        }
    }

    // Busca marcas de um promotor específico
    async getPromoterBrandsByPromoterId(promoterId) {
        try {
            const response = await api.get(
                `${this.baseURL}?promoter=${promoterId}`
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar marcas do promotor ${promoterId}:`, error);
            Toast.showToast("Erro ao carregar marcas do promotor", "error");
            throw error;
        }
    }

    // Cria uma nova associação entre promotor e marca
    async createPromoterBrand(promoterId, brandId) {
        try {
            const response = await api.post(
                this.baseURL,
                { promoter: promoterId, brand: brandId }
            );
            Toast.showToast("Marca associada ao promotor com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao associar marca ao promotor:", error);
            Toast.showToast("Erro ao associar marca ao promotor", "error");
            throw error;
        }
    }

    // Remove uma associação entre promotor e marca
    async deletePromoterBrand(id) {
        try {
            await api.delete(`${this.baseURL}${id}/`);
            Toast.showToast("Marca removida do promotor com sucesso!", "success");
        } catch (error) {
            console.error(`Erro ao remover marca do promotor:`, error);
            Toast.showToast("Erro ao remover marca do promotor", "error");
            throw error;
        }
    }
}

export default new PromoterBrandRepository(); 