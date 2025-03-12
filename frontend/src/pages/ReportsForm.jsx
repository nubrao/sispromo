import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import React from "react";

const Reports = () => {
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [reports, setReports] = useState([]);
    const [viewMode, setViewMode] = useState("table"); // 'table' ou 'calendar'
    const [promoterDates, setPromoterDates] = useState({});

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchFilters = async () => {
        try {
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

            // Remove duplicatas usando Set e mantém apenas uma ocorrência de cada ID
            const uniqueBrands = Array.from(
                new Set(brandsRes.data.map(JSON.stringify))
            ).map(JSON.parse);

            setPromoters(promotersRes.data);
            setStores(storesRes.data);
            setBrands(uniqueBrands);
        } catch (error) {
            console.error("Erro ao buscar filtros", error);
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
            const promoterCompare = a.promoter.name.localeCompare(
                b.promoter.name
            );
            if (promoterCompare !== 0) return promoterCompare;
            // Depois por data
            return new Date(a.visit_date) - new Date(b.visit_date);
        });

        // Agrupar por promotor
        const groupedByPromoter = {};
        sortedReports.forEach((visit) => {
            const promoterId = visit.promoter.id;
            if (!groupedByPromoter[promoterId]) {
                groupedByPromoter[promoterId] = {
                    promoter: visit.promoter,
                    visits: [],
                    total: 0,
                };
            }
            groupedByPromoter[promoterId].visits.push(visit);
            groupedByPromoter[promoterId].total += visit.visit_price;
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
                        ([promoterId, { promoter, visits, total }]) => (
                            <React.Fragment key={`group-${promoterId}`}>
                                {visits.map((visit) => (
                                    <tr key={`visit-${visit.id}`}>
                                        <td>
                                            {new Date(
                                                visit.visit_date
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>{visit.promoter.name}</td>
                                        <td>{visit.store.name}</td>
                                        <td>{visit.brand.name}</td>
                                        <td>
                                            R$ {visit.visit_price.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr
                                    className="total-row"
                                    key={`total-${promoterId}`}
                                >
                                    <td colSpan="4" className="total-label">
                                        Total Acumulado ({promoter.name}):
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
                                <h3>{promoter.name}</h3>
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

    return (
        <div className="form-container">
            <h2 className="form-title">Relatório de Visitas</h2>

            <div className="filter-container">
                <section className="report-filters">
                    <select
                        value={selectedPromoter}
                        onChange={(e) => setSelectedPromoter(e.target.value)}
                        className="form-input-text"
                    >
                        <option value="" key="select-promoter">
                            Selecione um Promotor
                        </option>
                        {promoters.map((promoter) => (
                            <option
                                key={`select-promoter-${promoter.id}`}
                                value={promoter.id}
                            >
                                {promoter.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="form-input-text"
                    >
                        <option value="" key="select-store">
                            Selecione uma Loja
                        </option>
                        {stores.map((store) => (
                            <option
                                key={`select-store-${store.id}`}
                                value={store.id}
                            >
                                {store.name} - {store.number}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="form-input-text"
                    >
                        <option value="" key="select-brand-default">
                            Selecione uma Marca
                        </option>
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
                                    key={`brand-${brand.brand_id}-${brand.brand_name}`}
                                    value={brand.brand_id}
                                >
                                    {brand.brand_name}
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
                            📋 Tabela
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`form-button ${
                                viewMode === "calendar" ? "active" : ""
                            }`}
                        >
                            📅 Calendário
                        </button>
                    </div>

                    <button onClick={fetchReports} className="form-button">
                        Gerar Relatório
                    </button>

                    <div className="export-buttons">
                        <button
                            onClick={() => handleExport("excel")}
                            className="form-button"
                        >
                            📊 Exportar Excel
                        </button>
                        <button
                            onClick={() => handleExport("pdf")}
                            className="form-button"
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
