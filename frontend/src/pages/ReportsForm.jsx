import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import React from "react";
import { RoleContext } from "../context/RoleContext";

const Reports = () => {
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [reports, setReports] = useState([]);
    const [viewMode, setViewMode] = useState("table");
    const [promoterDates, setPromoterDates] = useState({});

    const [selectedPromoter, setSelectedPromoter] = useState("");
    const [selectedStore, setSelectedStore] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);
    const { isPromoter } = useContext(RoleContext);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (isPromoter()) {
                    const userResponse = await axios.get(
                        `${API_URL}/api/users/me/`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    setSelectedPromoter(userResponse.data.promoter_id);
                }

                await Promise.all([
                    fetchPromoters(),
                    fetchStores(),
                    fetchBrands(),
                ]);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_URL, token, isPromoter]);

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPromoters(response.data);
        } catch (error) {
            console.error("Erro ao buscar promotores:", error);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stores/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStores(response.data);
        } catch (error) {
            console.error("Erro ao buscar lojas:", error);
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/brands/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBrands(response.data);
        } catch (error) {
            console.error("Erro ao buscar marcas:", error);
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

    const handleExport = async (type) => {
        setLoading(true);

        const params = new URLSearchParams();
        if (selectedPromoter) params.append("promoter", selectedPromoter);
        if (selectedStore) params.append("store", selectedStore);
        if (selectedBrand) params.append("brand", selectedBrand);
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);

        const url = `${API_URL}/api/visits/export_${type}/?${params.toString()}`;

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Erro ao gerar relatório");

            // Criando um blob para download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `relatorio_visitas.${
                type === "excel" ? "xlsx" : "pdf"
            }`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("Erro ao exportar relatório:", error);
        } finally {
            setLoading(false);
        }
    };

    const groupVisitsByDate = (visits) => {
        const groupedVisits = {};
        visits.forEach((visit) => {
            const date = visit.visit_date;
            if (!groupedVisits[date]) {
                groupedVisits[date] = {
                    visits: [],
                    totalValue: 0,
                };
            }
            groupedVisits[date].visits.push(visit);
            groupedVisits[date].totalValue += visit.visit_price;
        });
        return groupedVisits;
    };

    const calculateMonthTotal = (visitsByDate, currentMonth, currentYear) => {
        return Object.entries(visitsByDate).reduce((total, [date, data]) => {
            const visitDate = new Date(date);
            if (
                visitDate.getMonth() === currentMonth &&
                visitDate.getFullYear() === currentYear
            ) {
                return total + data.totalValue;
            }
            return total;
        }, 0);
    };

    const renderTableView = () => {
        if (!reports.length) return <p>Nenhum dado encontrado.</p>;

        // Ordenar por promotor e data
        const sortedReports = [...reports].sort((a, b) => {
            // Primeiro ordena por promotor
            const promoterCompare = a.promoter.name
                .toUpperCase()
                .localeCompare(b.promoter.name.toUpperCase());
            if (promoterCompare !== 0) return promoterCompare;
            // Depois por data
            return new Date(a.visit_date) - new Date(b.visit_date);
        });

        // Agrupar por promotor
        const groupedByPromoter = {};
        sortedReports.forEach((visit) => {
            const promoterName = visit.promoter.name.toUpperCase();
            if (!groupedByPromoter[promoterName]) {
                groupedByPromoter[promoterName] = {
                    visits: [],
                    total: 0,
                };
            }
            groupedByPromoter[promoterName].visits.push(visit);
            groupedByPromoter[promoterName].total += visit.visit_price;
        });

        return (
            <table className="table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Promotor</th>
                        <th>Loja</th>
                        <th>Marca</th>
                        <th>Valor por Visita (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(groupedByPromoter).map(
                        ([promoterName, { visits, total }]) => (
                            <React.Fragment
                                key={`promoter-group-${promoterName}`}
                            >
                                {visits.map((visit, index) => (
                                    <tr key={`visit-${promoterName}-${index}`}>
                                        <td>{visit.visit_date}</td>
                                        <td>
                                            {visit?.promoter?.name?.toUpperCase() ||
                                                ""}
                                        </td>
                                        <td>
                                            {visit?.store?.name &&
                                            visit?.store?.number
                                                ? `${visit.store.name.toUpperCase()} - ${
                                                      visit.store.number
                                                  }`
                                                : ""}
                                        </td>

                                        <td>
                                            {visit?.brand?.name?.toUpperCase() ||
                                                ""}
                                        </td>
                                        <td>
                                            R$ {visit.visit_price.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr
                                    className="total-row"
                                    key={`total-${promoterName}`}
                                >
                                    <td colSpan="4" className="total-label">
                                        Total Acumulado ({promoterName}):
                                    </td>
                                    <td className="total-value">
                                        R$ {total.toFixed(2)}
                                    </td>
                                </tr>
                            </React.Fragment>
                        )
                    )}
                </tbody>
            </table>
        );
    };

    const renderCalendarView = () => {
        if (!reports.length) return <p>Nenhum dado encontrado.</p>;

        const groupedByPromoter = {};
        reports.forEach((visit) => {
            const promoterId = visit.promoter.id;
            if (!groupedByPromoter[promoterId]) {
                groupedByPromoter[promoterId] = {
                    promoter: visit.promoter,
                    visits: [],
                };
                // Inicializa a data atual para este promotor se ainda não existir
                if (!promoterDates[promoterId]) {
                    setPromoterDates((prev) => ({
                        ...prev,
                        [promoterId]: new Date(),
                    }));
                }
            }
            groupedByPromoter[promoterId].visits.push(visit);
        });

        return (
            <div className="calendar-view">
                {Object.entries(groupedByPromoter).map(
                    ([promoterId, { promoter, visits }]) => {
                        const visitsByDate = groupVisitsByDate(visits);
                        const currentPromoterDate =
                            promoterDates[promoterId] || new Date();
                        const monthTotal = calculateMonthTotal(
                            visitsByDate,
                            currentPromoterDate.getMonth(),
                            currentPromoterDate.getFullYear()
                        );

                        return (
                            <div
                                key={`calendar-promoter-${promoterId}`}
                                className="promoter-calendar"
                            >
                                <h3>{promoter?.name?.toUpperCase() || ""}</h3>
                                <div className="calendar-stats">
                                    <p>
                                        Total em{" "}
                                        {currentPromoterDate.toLocaleString(
                                            "pt-BR",
                                            {
                                                month: "long",
                                                year: "numeric",
                                            }
                                        )}
                                        : R$ {monthTotal.toFixed(2)}
                                    </p>
                                </div>
                                <Calendar
                                    value={null}
                                    activeStartDate={currentPromoterDate}
                                    onActiveStartDateChange={({
                                        activeStartDate,
                                    }) =>
                                        setPromoterDates((prev) => ({
                                            ...prev,
                                            [promoterId]: activeStartDate,
                                        }))
                                    }
                                    calendarType="gregory"
                                    locale="pt-BR"
                                    formatDay={(locale, date) => date.getDate()}
                                    tileClassName={({ date }) => {
                                        const dateStr = date
                                            .toISOString()
                                            .split("T")[0];
                                        return visitsByDate[dateStr]
                                            ? "has-visits"
                                            : "";
                                    }}
                                    tileContent={({ date }) => {
                                        const dateStr = date
                                            .toISOString()
                                            .split("T")[0];
                                        const dayData = visitsByDate[dateStr];
                                        if (dayData) {
                                            return (
                                                <div
                                                    key={`visit-day-${promoterId}-${dateStr}`}
                                                    className="visit-day-content"
                                                >
                                                    <small>
                                                        R${" "}
                                                        {dayData.totalValue.toFixed(
                                                            2
                                                        )}
                                                    </small>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </div>
                        );
                    }
                )}
            </div>
        );
    };

    const handleBrandChange = (e) => {
        setSelectedBrand(e.target.value);
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Relatório de Visitas</h2>

            <div className="filter-container">
                <section className="report-filters">
                    {!isPromoter() && (
                        <div className="form-group">
                            <select
                                id="promoter"
                                value={selectedPromoter}
                                onChange={(e) =>
                                    setSelectedPromoter(e.target.value)
                                }
                                className="form-input-text"
                            >
                                <option value="">Todos</option>
                                {promoters.map((promoter) => (
                                    <option
                                        key={promoter.id}
                                        value={promoter.id}
                                    >
                                        {promoter.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="form-group">
                        <select
                            id="store"
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="form-input-text"
                        >
                            <option value="">Todas as Lojas</option>
                            {stores.map((store) => (
                                <option key={store.id} value={store.id}>
                                    {store.name.toUpperCase()}
                                    {store.number &&
                                        ` - ${store.number}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <select
                        value={selectedBrand}
                        onChange={handleBrandChange}
                        className="form-input-text"
                    >
                        <option value="">Todas as Marcas</option>
                        {brands
                            .filter(
                                (brand, index, self) =>
                                    index ===
                                    self.findIndex(
                                        (b) => b.brand_id === brand.brand_id
                                    )
                            )
                            .map((brand) => (
                                <option
                                    key={`brand-${brand.brand_id}`}
                                    value={brand.brand_id}
                                >
                                    {brand?.brand_name?.toUpperCase() || ""}
                                </option>
                            ))}
                    </select>
                </section>

                <section className="report-dates">
                    <div>
                        <label className="form-label">Data Inicial:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="form-input-text"
                        />
                    </div>

                    <div>
                        <label className="form-label">Data Final:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="form-input-text"
                        />
                    </div>
                </section>

                <section className="report-button-container">
                    <div className="view-mode-buttons">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`form-button ${
                                viewMode === "table" ? "active" : ""
                            }`}
                        >
                            Visualização em Tabela
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`form-button ${
                                viewMode === "calendar" ? "active" : ""
                            }`}
                        >
                            Visualização em Calendário
                        </button>
                    </div>

                    <div className="report-actions">
                        <button
                            type="button"
                            onClick={fetchReports}
                            className="form-button"
                        >
                            Gerar Relatório
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setSelectedPromoter("");
                                setSelectedStore("");
                                setSelectedBrand("");
                                setStartDate("");
                                setEndDate("");
                            }}
                            className="form-button clear-button"
                        >
                            Limpar Filtros
                        </button>
                    </div>

                    <div className="export-buttons">
                        <button
                            onClick={() => handleExport("excel")}
                            className={`form-button ${
                                !reports.length ? "disabled" : ""
                            }`}
                            disabled={!reports.length}
                            title={
                                !reports.length
                                    ? "Para exportar em Excel, primeiro gere um relatório usando os filtros"
                                    : "Exportar relatório em Excel"
                            }
                        >
                            📊 Exportar Excel
                        </button>
                        <button
                            onClick={() => handleExport("pdf")}
                            className={`form-button ${
                                !reports.length ? "disabled" : ""
                            }`}
                            disabled={!reports.length}
                            title={
                                !reports.length
                                    ? "Para exportar em PDF, primeiro gere um relatório usando os filtros"
                                    : "Exportar relatório em PDF"
                            }
                        >
                            📄 Exportar PDF
                        </button>
                    </div>
                </section>
            </div>

            <div className={`table-container ${viewMode}`}>
                {loading ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : viewMode === "table" ? (
                    renderTableView()
                ) : (
                    renderCalendarView()
                )}
            </div>
        </div>
    );
};

export default Reports;
