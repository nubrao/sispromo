import axios from "axios";
import { Toast } from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL;

class VisitRepository {
    constructor() {
        this.baseURL = `${API_URL}/api/visits/`;
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

    async getAllVisits(promoterId = null) {
        try {
            let url = this.baseURL;
            if (promoterId) {
                url += `?promoter_id=${promoterId}`;
            }

            const response = await axios.get(url, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar visitas:", error);
            Toast.showToast("Erro ao carregar visitas", "error");
            throw error;
        }
    }

    async getVisitsByPromoter(promoterId) {
        try {
            const response = await axios.get(
                `${this.baseURL}?promoter_id=${promoterId}`,
                this.getHeaders()
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar visitas do promotor:", error);
            throw error;
        }
    }

    async createVisit(visitData) {
        try {
            const response = await axios.post(this.baseURL, visitData, this.getHeaders());
            Toast.showToast("Visita cadastrada com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao criar visita:", error);
            Toast.showToast("Erro ao cadastrar visita", "error");
            throw error;
        }
    }

    async updateVisit(visitId, visitData) {
        try {
            const response = await axios.put(
                `${this.baseURL}${visitId}/`,
                visitData,
                this.getHeaders()
            );
            Toast.showToast("Visita atualizada com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar visita:", error);
            Toast.showToast("Erro ao atualizar visita", "error");
            throw error;
        }
    }

    async deleteVisit(visitId) {
        try {
            await axios.delete(`${this.baseURL}${visitId}/`, this.getHeaders());
            Toast.showToast("Visita excluída com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao excluir visita:", error);
            Toast.showToast("Erro ao excluir visita", "error");
            throw error;
        }
    }

    async getVisitsByFilters(filters) {
        try {
            const queryParams = new URLSearchParams();
            if (filters.promoterId) queryParams.append("promoter", filters.promoterId);
            if (filters.storeId) queryParams.append("store", filters.storeId);
            if (filters.brandId) queryParams.append("brand", filters.brandId);
            if (filters.startDate) queryParams.append("start_date", filters.startDate);
            if (filters.endDate) queryParams.append("end_date", filters.endDate);

            const url = `${this.baseURL}?${queryParams.toString()}`;
            const response = await axios.get(url, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar visitas com filtros:", error);
            Toast.showToast("Erro ao carregar visitas", "error");
            throw error;
        }
    }
}

export default new VisitRepository(); 