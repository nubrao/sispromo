import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import storeRepository from "../repositories/storeRepository";
import { Toast } from "../components/Toast";
import { useTranslation } from "react-i18next";
import { Form, Select, DatePicker, Button, Card, Table, Space } from "antd";
import { toast } from "react-toastify";
import api from "../services/api";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const Reports = () => {
    const { t } = useTranslation(["reports", "common"]);
    const [form] = Form.useForm();
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [reports, setReports] = useState([]);
    const [viewMode, setViewMode] = useState("table");
    const [promoterDates, setPromoterDates] = useState({});
    const [loading, setLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, token]);

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const promoterOptions = response.data.map((promoter) => ({
                value: promoter.id,
                label: `${promoter.name} (${promoter.email || "Sem email"})`,
                name: promoter.name,
                email: promoter.email,
            }));
            setPromoters(promoterOptions);
        } catch (error) {
            console.error("Erro ao buscar promotores:", error);
        }
    };

    const fetchStores = async () => {
        try {
            const data = await storeRepository.getAllStores();
            setStores(data);
        } catch (error) {
            console.error("Erro ao buscar lojas:", error);
            Toast.showToast("Erro ao carregar lojas", "error");
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

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (values.promoter_id) {
                params.append("promoter_id", values.promoter_id);
            }
            if (values.brand_id) {
                params.append("brand_id", values.brand_id);
            }
            if (values.store_id) {
                params.append("store_id", values.store_id);
            }
            if (values.date_range) {
                params.append(
                    "start_date",
                    values.date_range[0].format("YYYY-MM-DD")
                );
                params.append(
                    "end_date",
                    values.date_range[1].format("YYYY-MM-DD")
                );
            }

            const response = await api.get(
                `/api/visits/report/?${params.toString()}`
            );
            setReports(response.data);
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            toast.error(t("reports:messages.error.generate"));
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: t("reports:list.columns.promoter"),
            dataIndex: "promoter_name",
            key: "promoter_name",
        },
        {
            title: t("reports:list.columns.brand"),
            dataIndex: "brand_name",
            key: "brand_name",
        },
        {
            title: t("reports:list.columns.store"),
            dataIndex: "store_name",
            key: "store_name",
            render: (text, record) =>
                `${text} - ${record.store_number || "S/N"}`,
        },
        {
            title: t("reports:list.columns.date"),
            dataIndex: "visit_date",
            key: "visit_date",
            render: (date) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: t("reports:list.columns.price"),
            dataIndex: "price",
            key: "price",
            render: (price) => `R$ ${parseFloat(price).toFixed(2)}`,
        },
    ];

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
            <Table
                columns={columns}
                dataSource={sortedReports}
                loading={loading}
                rowKey="id"
                pagination={{
                    total: reports.length,
                    pageSize: 10,
                    showTotal: (total) =>
                        t("common:table.pagination.total", { total }),
                }}
                summary={(pageData) => {
                    const totalPrice = pageData.reduce(
                        (sum, row) => sum + parseFloat(row.price),
                        0
                    );
                    return (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong>{t("reports:list.total")}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                                <strong>R$ {totalPrice.toFixed(2)}</strong>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    );
                }}
            />
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

    return (
        <Card title={t("reports:title")}>
            <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Form.Item
                    name="promoter_id"
                    label={t("reports:form.fields.promoter.label")}
                >
                    <Select
                        allowClear
                        placeholder={t(
                            "reports:form.fields.promoter.placeholder"
                        )}
                        options={promoters.map((promoter) => ({
                            value: promoter.id,
                            label: promoter.name,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="brand_id"
                    label={t("reports:form.fields.brand.label")}
                >
                    <Select
                        allowClear
                        placeholder={t("reports:form.fields.brand.placeholder")}
                        options={brands.map((brand) => ({
                            value: brand.brand_id,
                            label: brand.brand_name,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="store_id"
                    label={t("reports:form.fields.store.label")}
                >
                    <Select
                        allowClear
                        placeholder={t("reports:form.fields.store.placeholder")}
                        options={stores.map((store) => ({
                            value: store.id,
                            label: `${store.name} - ${store.number}`,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="date_range"
                    label={t("reports:form.fields.date_range.label")}
                >
                    <RangePicker
                        format="DD/MM/YYYY"
                        placeholder={[
                            t("reports:form.fields.date_range.start"),
                            t("reports:form.fields.date_range.end"),
                        ]}
                    />
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            {loading
                                ? t("reports:form.buttons.processing")
                                : t("reports:form.buttons.generate")}
                        </Button>
                        <Button onClick={() => form.resetFields()}>
                            {t("reports:form.buttons.clear")}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>

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
        </Card>
    );
};

export default Reports;
