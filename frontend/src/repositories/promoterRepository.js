import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class PromoterRepository {
    constructor() {
        this.baseURL = `${API_URL}/api/promoters/`;
    }

    // Configura o header de autorização
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    // Lista todos os promotores
    async getAllPromoters() {
        try {
            const response = await axios.get(this.baseURL, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar promotores:", error);
            throw error;
        }
    }

    // Busca um promotor específico
    async getPromoterById(id) {
        try {
            const response = await axios.get(`${this.baseURL}${id}/`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar promotor ${id}:`, error);
            throw error;
        }
    }

    // Cria um novo promotor
    async createPromoter(promoterData) {
        try {
            const response = await axios.post(this.baseURL, promoterData, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao criar promotor:", error);
            throw error;
        }
    }

    // Atualiza um promotor existente
    async updatePromoter(id, promoterData) {
        try {
            const response = await axios.put(`${this.baseURL}${id}/`, promoterData, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar promotor ${id}:`, error);
            throw error;
        }
    }

    // Remove um promotor
    async deletePromoter(id) {
        try {
            await axios.delete(`${this.baseURL}${id}/`, this.getHeaders());
        } catch (error) {
            console.error(`Erro ao excluir promotor ${id}:`, error);
            throw error;
        }
    }

    // Vincula um promotor a um usuário
    async linkPromoterToUser(promoterId, userId) {
        try {
            const response = await axios.post(
                `${this.baseURL}${promoterId}/link_user/`,
                { user_id: userId },
                this.getHeaders()
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao vincular promotor ${promoterId} ao usuário ${userId}:`, error);
            throw error;
        }
    }
}

export default new PromoterRepository(); 