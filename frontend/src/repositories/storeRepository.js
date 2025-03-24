import axios from 'axios';
import { Toast } from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL;

class StoreRepository {
    constructor() {
        this.baseURL = `${API_URL}/api/stores/`;
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
            const response = await axios.get(this.baseURL, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar lojas:", error);
            Toast.showToast("Erro ao carregar lojas", "error");
            throw error;
        }
    }

    async getStoreById(id) {
        try {
            const response = await axios.get(`${this.baseURL}${id}/`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar loja ${id}:`, error);
            Toast.showToast("Erro ao carregar loja", "error");
            throw error;
        }
    }

    async createStore(storeData) {
        try {
            const response = await axios.post(this.baseURL, storeData, this.getHeaders());
            Toast.showToast("Loja cadastrada com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao criar loja:", error);
            Toast.showToast("Erro ao cadastrar loja", "error");
            throw error;
        }
    }

    async updateStore(id, storeData) {
        try {
            const response = await axios.put(`${this.baseURL}${id}/`, storeData, this.getHeaders());
            Toast.showToast("Loja atualizada com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar loja ${id}:`, error);
            Toast.showToast("Erro ao atualizar loja", "error");
            throw error;
        }
    }

    async deleteStore(id) {
        try {
            await axios.delete(`${this.baseURL}${id}/`, this.getHeaders());
            Toast.showToast("Loja excluída com sucesso!", "success");
        } catch (error) {
            console.error(`Erro ao excluir loja ${id}:`, error);
            Toast.showToast("Erro ao excluir loja", "error");
            throw error;
        }
    }
}

export default new StoreRepository(); 