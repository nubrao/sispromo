import api from '../services/api';
import { Toast } from '../components/Toast';

class StoreRepository {
    constructor() {
        this.baseURL = '/api/stores/';
    }

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

    async getAllStores() {
        try {
            const response = await api.get(this.baseURL, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar lojas:", error);
            Toast.showToast("Erro ao carregar lojas", "error");
            throw error;
        }
    }

    async getStore(id) {
        try {
            const response = await api.get(`${this.baseURL}${id}/`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar loja:", error);
            Toast.showToast("Erro ao carregar loja", "error");
            throw error;
        }
    }

    async createStore(data) {
        try {
            const response = await api.post(this.baseURL, data, this.getHeaders());
            Toast.showToast("Loja cadastrada com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao criar loja:", error);
            Toast.showToast("Erro ao cadastrar loja", "error");
            throw error;
        }
    }

    async updateStore(id, data) {
        try {
            const response = await api.patch(`${this.baseURL}${id}/`, data, this.getHeaders());
            Toast.showToast("Loja atualizada com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar loja:", error);
            Toast.showToast("Erro ao atualizar loja", "error");
            throw error;
        }
    }

    async deleteStore(id) {
        try {
            await api.delete(`${this.baseURL}${id}/`, this.getHeaders());
            Toast.showToast("Loja excluída com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao excluir loja:", error);
            Toast.showToast("Erro ao excluir loja", "error");
            throw error;
        }
    }
}

export default new StoreRepository(); 