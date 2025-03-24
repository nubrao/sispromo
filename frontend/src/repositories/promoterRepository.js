import api from '../services/api';

class PromoterRepository {
    constructor() {
        this.baseURL = '/api/users/';
    }

    // Configura o header de autorização
    getHeaders() {
        const token = localStorage.getItem('@SisPromo:token');
        if (!token) {
            throw new Error('Token não encontrado');
        }
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    }

    // Lista todos os promotores
    async getAllPromoters() {
        try {
            const response = await api.get(this.baseURL);
            return response.data.filter(user => user.role === 'promoter');
        } catch (error) {
            console.error("Erro ao buscar promotores:", error);
            throw error;
        }
    }

    // Busca um promotor específico
    async getPromoterById(id) {
        try {
            const response = await api.get(`${this.baseURL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar promotor ${id}:`, error);
            throw error;
        }
    }

    // Cria um novo promotor
    async createPromoter(promoterData) {
        try {
            const response = await api.post(`${this.baseURL}register/`, {
                ...promoterData,
                role: 'promoter'
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao criar promotor:", error);
            throw error;
        }
    }

    // Atualiza um promotor existente
    async updatePromoter(id, promoterData) {
        try {
            const response = await api.patch(`${this.baseURL}${id}/`, promoterData);
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar promotor ${id}:`, error);
            throw error;
        }
    }

    // Remove um promotor
    async deletePromoter(id) {
        try {
            await api.delete(`${this.baseURL}${id}/`);
        } catch (error) {
            console.error(`Erro ao excluir promotor ${id}:`, error);
            throw error;
        }
    }

    // Vincula um promotor a um usuário
    async linkPromoterToUser(promoterId, userId) {
        try {
            const response = await api.post(
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