import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class StateRepository {
    constructor() {
        this.baseURL = `${API_URL}/api/states/`;
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

    async getAllStates() {
        try {
            const response = await axios.get(this.baseURL, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar estados:", error);
            throw error;
        }
    }
}

export default new StateRepository(); 