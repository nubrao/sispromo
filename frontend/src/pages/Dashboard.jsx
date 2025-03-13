import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/dashboard.css";
import Loader from "../components/Loader";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterBrand, setFilterBrand] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [viewMode, setViewMode] = useState("detalhado"); // "detalhado" ou "simplificado"
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboardData, filterBrand, filterStore]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/api/visits/dashboard/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setDashboardData(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Erro ao buscar dados do dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...dashboardData];

        if (filterBrand) {
            const searchBrand = filterBrand.toLowerCase();
            filtered = filtered.filter((brand) =>
                brand.brand_name.toLowerCase().includes(searchBrand)
            );
        }

        if (filterStore) {
            const searchStore = filterStore.toLowerCase();
            filtered = filtered.filter((brand) =>
                brand.stores.some(
                    (store) =>
                        store.store_name.toLowerCase().includes(searchStore) ||
                        store.store_number.toString().includes(searchStore)
                )
            );
        }

        setFilteredData(filtered);
    };

    const clearFilters = () => {
        setFilterBrand("");
        setFilterStore("");
        setFilteredData(dashboardData);
    };

    const renderBrandCardSimplified = (brand) => (
        <div key={brand.brand_id} className="brand-card simplified">
            <div className="brand-header">
                <h3>{brand.brand_name.toUpperCase()}</h3>
                <div className="brand-quick-stats">
                    <span>
                        {brand.total_visits_done}/{brand.total_visits_expected}{" "}
                        visitas
                    </span>
                </div>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${brand.total_progress}%` }}
                ></div>
            </div>
        </div>
    );

    const renderBrandCardDetailed = (brand) => (
        <div key={brand.brand_id} className="brand-card">
            <h3>{brand.brand_name.toUpperCase()}</h3>
            <div className="brand-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${brand.total_progress}%` }}
                    ></div>
                </div>
                <span className="progress-text">
                    {brand.total_visits_done}/{brand.total_visits_expected}{" "}
                    visitas
                </span>
            </div>
            <div className="brand-stats">
                <div className="stat-item">
                    <span className="stat-label">Lojas:</span>
                    <span className="stat-value">{brand.total_stores}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Progresso:</span>
                    <span className="stat-value">
                        {brand.total_progress.toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="store-list">
                {brand.stores.map((store) => (
                    <div key={store.store_id} className="store-item">
                        <div className="store-header">
                            <h4>
                                {store.store_name.toUpperCase()} -{" "}
                                {store.store_number}
                            </h4>
                            <span className="store-frequency">
                                {store.visit_frequency}x/semana
                            </span>
                        </div>
                        <div className="store-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${store.progress}%` }}
                                ></div>
                            </div>
                            <span className="progress-text">
                                {store.visits_done}/{store.visit_frequency}{" "}
                                visitas
                            </span>
                        </div>
                        <div className="store-details">
                            <span>
                                Última visita:{" "}
                                {store.last_visit
                                    ? new Date(
                                          store.last_visit
                                      ).toLocaleDateString("pt-BR")
                                    : "Nenhuma"}
                            </span>
                            <span>
                                Faltam: {store.visits_remaining} visitas
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCharts = () => {
        const chartData = filteredData.map((brand) => ({
            name: brand.brand_name.toUpperCase(),
            visitasRealizadas: brand.total_visits_done,
            visitasEsperadas: brand.total_visits_expected,
            progresso: brand.total_progress,
        }));

        return (
            <div className="charts-section">
                <div className="chart-card">
                    <h3>Visitas Realizadas vs Esperadas</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="visitasRealizadas"
                                name="Realizadas"
                                fill="#4CAF50"
                            />
                            <Bar
                                dataKey="visitasEsperadas"
                                name="Esperadas"
                                fill="#2196F3"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">Dashboard de Visitas</h2>

            <div className="dashboard-content">
                {loading ? (
                    <div className="dashboard-content-loading">
                        <Loader />
                    </div>
                ) : (
                    <>
                        {renderCharts()}

                        <div className="dashboard-controls">
                            <div className="filters">
                                <input
                                    type="text"
                                    placeholder="Filtrar por marca"
                                    value={filterBrand}
                                    onChange={(e) =>
                                        setFilterBrand(e.target.value)
                                    }
                                    className="filter-input"
                                />
                                <input
                                    type="text"
                                    placeholder="Filtrar por loja"
                                    value={filterStore}
                                    onChange={(e) =>
                                        setFilterStore(e.target.value)
                                    }
                                    className="filter-input"
                                />
                                <button
                                    onClick={clearFilters}
                                    className="clear-button"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                            <div className="view-mode-buttons">
                                <button
                                    className={`view-mode-button ${
                                        viewMode === "detalhado" ? "active" : ""
                                    }`}
                                    onClick={() => setViewMode("detalhado")}
                                >
                                    Visão Detalhada
                                </button>
                                <button
                                    className={`view-mode-button ${
                                        viewMode === "simplificado"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() => setViewMode("simplificado")}
                                >
                                    Visão Simplificada
                                </button>
                            </div>
                        </div>
                        <div className={`brands-grid ${viewMode}`}>
                            {filteredData.map((brand) =>
                                viewMode === "simplificado"
                                    ? renderBrandCardSimplified(brand)
                                    : renderBrandCardDetailed(brand)
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
