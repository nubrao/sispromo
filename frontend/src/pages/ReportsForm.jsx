import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Empty,
    Table,
    Form,
    DatePicker,
    Select,
    Button,
    Space,
    message
} from 'antd';
import {
    TeamOutlined,
    UserOutlined,
    ShopOutlined,
    TagOutlined,
    ClearOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Loader from "../components/Loader";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import '../styles/reports.css';
import storeRepository from "../repositories/storeRepository";
import { Toast } from "../components/Toast";
import reportRepository from "../repositories/reportRepository";

const { RangePicker } = DatePicker;

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error in reports component:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    textAlign: 'center',
                    padding: '48px 16px'
                }}>
                    <h2>Algo deu errado</h2>
                    <p>Tente recarregar a página ou contate o suporte.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

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
            const data = await reportRepository.getPromoters();
            const promoterOptions = data.map((promoter) => ({
                value: promoter.id.toString(),
                label: promoter.full_name,
                name: promoter.full_name
            }));
            setPromoters(promoterOptions);
        } catch (error) {
            console.error("Erro ao buscar promotores:", error);
            toast.error(t("reports:messages.error.loadPromoters"));
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
            const data = await reportRepository.getBrands();
            setBrands(data);
        } catch (error) {
            console.error("Erro ao buscar marcas:", error);
            toast.error(t("reports:messages.error.loadBrands"));
        }
    };

    const columns = [
        {
            title: t("reports:list.columns.promoter"),
            dataIndex: ['promoter', 'name'],
            key: "promoter_name",
        },
        {
            title: t("reports:list.columns.brand"),
            dataIndex: ['brand', 'name'],
            key: "brand_name",
        },
        {
            title: t("reports:list.columns.store"),
            dataIndex: ['store', 'name'],
            key: "store_name",
            render: (text, record) =>
                `${text} - ${record.store.number || "S/N"}`,
        },
        {
            title: t("reports:list.columns.date"),
            dataIndex: "date",
            key: "date",
            render: (date) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: t("reports:list.columns.price"),
            dataIndex: "value",
            key: "value",
            render: (value) => `R$ ${parseFloat(value).toFixed(2)}`,
        },
    ];

    const renderSummary = () => {
        if (!reports?.summary) return null;

        return (
            <Card
                title={t("reports:summary.title")}
                className="summary-card"
                style={{ marginBottom: 24 }}
            >
                <Row gutter={[24, 16]}>
                    <Col span={24}>
                        <Typography.Text type="secondary">
                            {t("reports:summary.period")}:{' '}
                        </Typography.Text>
                        <Typography.Text>
                            {dayjs(reports.period.start_date).format("DD/MM/YYYY")} - {dayjs(reports.period.end_date).format("DD/MM/YYYY")}
                        </Typography.Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Statistic
                            title={t("reports:summary.totalVisits")}
                            value={reports.summary.total_visits}
                            prefix={<TeamOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Statistic
                            title={t("reports:summary.totalValue")}
                            value={reports.summary.total_value}
                            precision={2}
                            prefix="R$"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Statistic
                            title={t("reports:summary.uniquePromoters")}
                            value={reports.summary.unique_promoters}
                            prefix={<UserOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Statistic
                            title={t("reports:summary.uniqueStores")}
                            value={reports.summary.unique_stores}
                            prefix={<ShopOutlined />}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Statistic
                            title={t("reports:summary.uniqueBrands")}
                            value={reports.summary.unique_brands}
                            prefix={<TagOutlined />}
                        />
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderTableView = () => {
        if (!reports?.visits?.length) {
            return (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                    <Empty
                        description={t("reports:noData")}
                    />
                </div>
            );
        }

        return (
            <>
                {renderSummary()}
                <Table
                    columns={columns}
                    dataSource={reports.visits}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        total: reports.visits.length,
                        pageSize: 10,
                        showTotal: (total) =>
                            t("common:table.pagination.total", { total }),
                    }}
                    summary={(pageData) => {
                        const totalValue = pageData.reduce(
                            (sum, row) => sum + parseFloat(row.value || 0),
                            0
                        );
                        return (
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4}>
                                    <strong>{t("reports:list.total")}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                    <strong>R$ {totalValue.toFixed(2)}</strong>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        );
                    }}
                />
            </>
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

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            console.log('Form Values:', values);

            // Declare formattedValues at the beginning of the function
            const formattedValues = {};

            // Handle IDs - convert to numbers and check for valid values
            if (values.promoter_id && values.promoter_id !== '') {
                formattedValues.promoter_id = Number(values.promoter_id);
            }

            if (values.brand_id && values.brand_id !== '') {
                formattedValues.brand_id = Number(values.brand_id);
            }

            if (values.store_id && values.store_id !== '') {
                formattedValues.store_id = Number(values.store_id);
            }

            // Handle date range
            if (values.date_range?.length === 2) {
                formattedValues.start_date = values.date_range[0].format('YYYY-MM-DD');
                formattedValues.end_date = values.date_range[1].format('YYYY-MM-DD');
            }

            console.log('Formatted Values:', formattedValues);

            const response = await reportRepository.getReport(formattedValues);
            console.log('API Response:', response);

            if (!response || !response.visits) {
                message.info('Nenhum dado encontrado para os filtros selecionados');
                setReports(null);
                return;
            }

            setReports(response);
            message.success('Relatório gerado com sucesso');

        } catch (error) {
            console.error("Error details:", {
                error: error,
                response: error.response,
                data: error.response?.data
            });
            message.error('Erro ao gerar relatório. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromoterChange = (value) => {
        console.log('Selected promoter:', value);
        form.setFieldsValue({ promoter_id: value });
    };

    // Add a handler for brand selection
    const handleBrandChange = (value) => {
        console.log('Selected brand:', value);
        form.setFieldsValue({ brand_id: value });
    };

    return (
        <ErrorBoundary>
            <Card title={t("reports:title")}>
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item
                                name="promoter_id"
                                label={t("reports:form.fields.promoter.label")}
                            >
                                <Select
                                    showSearch
                                    placeholder={t("reports:form.fields.promoter.placeholder")}
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option?.label?.toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={promoters}
                                    onChange={handlePromoterChange}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Form.Item
                                name="brand_id"
                                label={t("reports:form.fields.brand.label")}
                            >
                                <Select
                                    showSearch
                                    placeholder={t("reports:form.fields.brand.placeholder")}
                                    optionFilterProp="children"
                                    onChange={handleBrandChange}
                                    filterOption={(input, option) =>
                                        option?.label?.toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={brands}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
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
                        </Col>

                        <Col xs={24} sm={12} md={6}>
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
                        </Col>
                    </Row>

                    <Row justify="end">
                        <Col>
                            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    className="form-button"
                                >
                                    {loading
                                        ? t("reports:form.buttons.processing")
                                        : t("reports:form.buttons.generate")}
                                </Button>
                                <Button
                                    type="default"
                                    icon={<ClearOutlined />}
                                    onClick={() => {
                                        form.resetFields();
                                        setReports(null);
                                    }}
                                    className="form-button clear-button"
                                >
                                    {t("reports:form.buttons.clear")}
                                </Button>
                            </Space>
                        </Col>
                    </Row>
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
        </ErrorBoundary>
    );
};

export default Reports;
