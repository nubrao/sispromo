import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";

const Reports = () => {
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [reports, setReports] = useState([]);

    const [selectedPromoter, setSelectedPromoter] = useState("");
    const [selectedStore, setSelectedStore] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchFilters();
    }, []);

    const fetchFilters = async () => {
        try {
            setLoading(true);
            const [promotersRes, storesRes, brandsRes] = await Promise.all([
                axios.get(`${API_URL}/api/promoters/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_URL}/api/stores/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_URL}/api/brands/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setPromoters(promotersRes.data);
            setStores(storesRes.data);
            setBrands(brandsRes.data);
        } catch (error) {
            console.error("Erro ao buscar filtros", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/visits/reports/`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    promoter: selectedPromoter || undefined,
                    store: selectedStore || undefined,
                    brand: selectedBrand || undefined,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                },
            });

            setReports(response.data);
        } catch (error) {
            console.error("Erro ao buscar relatório", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Relatório de Visitas</h2>

            <div className="filter-container">
                <select
                    value={selectedPromoter}
                    onChange={(e) => setSelectedPromoter(e.target.value)}
                    className="form-input-text"
                >
                    <option value="">Selecione um Promotor</option>
                    {promoters.map((promoter) => (
                        <option key={promoter.id} value={promoter.id}>
                            {promoter.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="form-input-text"
                >
                    <option value="">Selecione uma Loja</option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                            {store.name} - {store.number}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="form-input-text"
                >
                    <option value="">Selecione uma Marca</option>
                    {brands.map((brand) => (
                        <option key={brand.brand_id} value={brand.brand_id}>
                            {brand.brand_name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input-text"
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input-text"
                />

                <button onClick={fetchReports} className="form-button">
                    Gerar Relatório
                </button>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : reports.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Promotor</th>
                                <th>Loja</th>
                                <th>Marca</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((visit) => (
                                <tr key={visit.id}>
                                    <td>
                                        {new Date(
                                            visit.visit_date
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>{visit.promoter.name}</td>
                                    <td>{visit.store.name}</td>
                                    <td>{visit.brand.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Nenhum dado encontrado.</p>
                )}
            </div>
        </div>
    );
};

export default Reports;
