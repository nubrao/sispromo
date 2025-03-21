import api from '../services/api';

class BrandRepository {
    constructor() {
        this.baseURL = '/api/brands/';
    }

    async getAllBrands() {
        const response = await api.get(this.baseURL);
        return response.data;
    }

    async getBrandById(id) {
        const response = await api.get(`${this.baseURL}${id}/`);
        return response.data;
    }

    async createBrand(brandData) {
        const response = await api.post(this.baseURL, brandData);
        return response.data;   
    }

    async updateBrand(id, brandData) {
        const response = await api.patch(`${this.baseURL}${id}/`, brandData);
        return response.data;
    }

    async deleteBrand(id) {
        await api.delete(`${this.baseURL}${id}/`);
    }
}

export default new BrandRepository(); 