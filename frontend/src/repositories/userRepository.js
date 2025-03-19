import axios from 'axios';
import { Toast } from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL;

class UserRepository {
    constructor() {
        this.baseURL = `${API_URL}/api/users/`;
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
            Toast.showToast("Erro ao carregar usuários", "error");
            throw error;
        }
    }

    // Busca um usuário específico
    async getUserById(id) {
        try {
            const response = await axios.get(`${this.baseURL}${id}/`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar usuário ${id}:`, error);
            Toast.showToast("Erro ao carregar usuário", "error");
            throw error;
        }
    }

    // Busca o usuário atual
    async getCurrentUser() {
        try {
            const response = await axios.get(`${API_URL}/api/users/me/`, this.getHeaders());
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar usuário atual:", error);
            Toast.showToast("Erro ao carregar usuário atual", "error");
            throw error;
        }
    }

    // Registra um novo usuário
    async registerUser(userData) {
        try {
            const response = await axios.post(this.baseURL, userData, this.getHeaders());
            Toast.showToast("Usuário cadastrado com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao registrar usuário:", error);
            Toast.showToast("Erro ao cadastrar usuário", "error");
            throw error;
        }
    }

    // Atualiza um usuário existente
    async updateUser(id, userData) {
        try {
            const response = await axios.put(`${this.baseURL}${id}/`, userData, this.getHeaders());
            Toast.showToast("Usuário atualizado com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar usuário ${id}:`, error);
            Toast.showToast("Erro ao atualizar usuário", "error");
            throw error;
        }
    }

    // Remove um usuário
    async deleteUser(id) {
        try {
            await axios.delete(`${this.baseURL}${id}/`, this.getHeaders());
            Toast.showToast("Usuário excluído com sucesso!", "success");
        } catch (error) {
            console.error(`Erro ao excluir usuário ${id}:`, error);
            Toast.showToast("Erro ao excluir usuário", "error");
            throw error;
        }
    }

    // Reseta a senha do usuário
    async resetPassword(resetData) {
        try {
            const response = await axios.post(`${API_URL}/api/reset-password/`, resetData, this.getHeaders());
            Toast.showToast("Senha resetada com sucesso!", "success");
            return response.data;
        } catch (error) {
            console.error("Erro ao resetar senha:", error);
            Toast.showToast("Erro ao resetar senha", "error");
            throw error;
        }
    }
}

export default new UserRepository(); 