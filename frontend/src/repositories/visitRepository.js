import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const visitRepository = {
    async fetchVisits(token, promoterId) {
        try {
            let url = `${API_URL}/api/visits/`;
            if (promoterId) {
                url += `?promoter_id=${promoterId}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar visitas:", error);
            throw error;
        }
    },

    async createVisit(token, visitData) {
        try {
            const response = await axios.post(
                `${API_URL}/api/visits/`,
                visitData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao criar visita:", error);
            throw error;
        }
    },

    async updateVisit(token, visitId, visitData) {
        try {
            const response = await axios.put(
                `${API_URL}/api/visits/${visitId}/`,
                visitData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Erro ao atualizar visita:", error);
            throw error;
        }
    },

    async deleteVisit(token, visitId) {
        try {
            await axios.delete(`${API_URL}/api/visits/${visitId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (error) {
            console.error("Erro ao excluir visita:", error);
            throw error;
        }
    },

    async fetchVisitsByFilters(token, filters) {
        try {
            const queryParams = new URLSearchParams();
            if (filters.promoterId) queryParams.append("promoter", filters.promoterId);
            if (filters.storeId) queryParams.append("store", filters.storeId);
            if (filters.brandId) queryParams.append("brand", filters.brandId);
            if (filters.startDate) queryParams.append("start_date", filters.startDate);
            if (filters.endDate) queryParams.append("end_date", filters.endDate);

            const url = `${API_URL}/api/visits/?${queryParams.toString()}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar visitas com filtros:", error);
            throw error;
        }
    },
}; 