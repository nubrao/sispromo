import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class UserRepository {
    constructor() {
        this.baseURL = `${API_URL}/api/users`;
    }

    // Configura o header de autorização
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    // Busca todos os usuários
    async getAllUsers() {
        try {
            const response = await axios.get(this.baseURL, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            throw error;
        }
    }

    // Busca um usuário específico
    async getUserById(id) {
        try {
            const response = await axios.get(`${this.baseURL}/${id}`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar usuário ${id}:`, error);
            throw error;
        }
    }

    // Busca o usuário atual
    async getCurrentUser() {
        try {
            const response = await axios.get(`${this.baseURL}/me/`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar usuário atual:", error);
            throw error;
        }
    }

    // Registra um novo usuário
    async registerUser(userData) {
        try {
            const response = await axios.post(`${this.baseURL}/register/`, userData);
            return response.data;
        } catch (error) {
            console.error("Erro ao registrar usuário:", error);
            throw error;
        }
    }

    // Atualiza um usuário existente
    async updateUser(id, userData) {
        try {
            const response = await axios.put(`${this.baseURL}/${id}`, userData, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar usuário ${id}:`, error);
            throw error;
        }
    }

    // Remove um usuário
    async deleteUser(id) {
        try {
            await axios.delete(`${this.baseURL}/${id}`, this.getHeaders());
        } catch (error) {
            console.error(`Erro ao excluir usuário ${id}:`, error);
            throw error;
        }
    }

    // Reseta a senha do usuário
    async resetPassword(resetData) {
        try {
            const response = await axios.post(`${this.baseURL}/reset-password/`, resetData);
            return response.data;
        } catch (error) {
            console.error("Erro ao resetar senha:", error);
            throw error;
        }
    }
}

export default new UserRepository(); 