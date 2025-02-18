import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";

const BrandForm = () => {
    const [brandName, setBrandName] = useState("");
    const [selectedPromoter, setSelectedPromoter] = useState("");
    const [selectedStore, setSelectedStore] = useState("");
    const [visitFrequency, setVisitFrequency] = useState("");
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchPromoters();
        fetchStores();
        fetchBrands();
    }, []);

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPromoters(response.data);
        } catch (error) {
            console.error("Erro ao buscar promotores", error);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stores/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStores(response.data);
        } catch (error) {
            console.error("Erro ao buscar lojas", error);
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/brands/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBrands(response.data);
        } catch (error) {
            console.error("Erro ao buscar marcas", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = {
            brand_name: brandName.trim(),
            promoter_name: selectedPromoter,
            store_name: selectedStore,
            visit_frequency: parseInt(visitFrequency, 10),
        };

        try {
            if (!brandName) {
                console.error("Nome da marca é obrigatório.");
                return;
            }

            await axios.post(
                `${API_URL}/api/brands/`,
                body,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            fetchBrands();
            setBrandName("");
            setSelectedPromoter("");
            setSelectedStore("");
            setVisitFrequency("");
        } catch (error) {
            console.error("Erro ao cadastrar marca", error);
        }
    };


    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Marcas</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <input
                    type="text"
                    placeholder="Nome da Marca"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="form-input-text"
                    required
                />

                <select
                    value={selectedPromoter}
                    onChange={(e) => setSelectedPromoter(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione o Promotor</option>
                    {promoters.map((promoter) => (
                        <option key={promoter.id} value={promoter.name}>
                            {promoter.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione a Loja</option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.name}>
                            {store.name} - {store.number}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Periodicidade"
                    value={visitFrequency}
                    onChange={(e) => setVisitFrequency(e.target.value)}
                    className="form-input-text"
                    min="1"
                    required
                />

                <button type="submit" className="form-button">
                    Cadastrar
                </button>
            </form>

            <h3 className="form-title">Lista de Marcas</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Marca</th>
                        <th>Promotor</th>
                        <th>Loja</th>
                        <th>Periodicidade</th>
                    </tr>
                </thead>
                <tbody>
                    {brands.map((brand, index) => (
                        <tr key={index}>
                            <td>{brand.brand_name}</td>
                            <td>{brand.promoter_name}</td>
                            <td>{brand.store_name}</td>
                            <td>{brand.visit_frequency}x por semana</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BrandForm;
