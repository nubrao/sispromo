import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Card, Row, Col, Statistic, Table, Progress } from "antd";
import { toast } from "react-toastify";
import api from "../services/api";
import "../styles/dashboard.css";
import Loader from "../components/Loader";
import { AuthContext } from "../contexts/AuthContext";
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
    const { t } = useTranslation(["dashboard", "common"]);
    const { user } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async (retryCount = 0) => {
        if (retryCount >= 3) {
            setError('Máximo de tentativas excedido');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/api/dashboard/");
            
            if (!response?.data) {
                throw new Error('Dados não recebidos');
            }

            setDashboardData(response.data);
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            
            if (error.code === 'ECONNABORTED') {
                console.log(`Tentativa ${retryCount + 1} de 3`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return loadDashboardData(retryCount + 1);
            }
            
            setError(error.message || t("dashboard:messages.error.load"));
            toast.error(t("dashboard:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const renderPromoterDashboard = () => {
        if (!dashboardData) return null;

        const {
            total_visits,
            pending_visits,
            completed_visits,
            brands_progress,
            pending_stores,
        } = dashboardData;

        return (
            <div className="promoter-dashboard">
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title={t("dashboard:stats.totalVisits")}
                                value={total_visits}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title={t("dashboard:stats.completedVisits")}
                                value={completed_visits}
                                valueStyle={{ color: "#3f8600" }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title={t("dashboard:stats.pendingVisits")}
                                value={pending_visits}
                                valueStyle={{ color: "#cf1322" }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card title={t("dashboard:brandProgress")} className="mt-4">
                    {brands_progress.map((brand) => (
                        <div
                            key={brand.brand_id}
                            className="brand-progress-item"
                        >
                            <h4>{brand.brand_name}</h4>
                            <Progress
                                percent={Math.round(
                                    (brand.visits_done / brand.total_visits) *
                                        100
                                )}
                                format={(percent) =>
                                    `${brand.visits_done}/${brand.total_visits}`
                                }
                            />
                        </div>
                    ))}
                </Card>

                <Card title={t("dashboard:pendingStores")} className="mt-4">
                    <Table
                        dataSource={pending_stores}
                        columns={[
                            {
                                title: t("dashboard:table.store"),
                                render: (_, record) =>
                                    `${record.store_name.toUpperCase()} - ${record.store_number}`,
                            },
                            {
                                title: t("dashboard:table.brand"),
                                dataIndex: "brand__name",
                            },
                            {
                                title: t("dashboard:table.date"),
                                dataIndex: "visit_date",
                                render: (date) =>
                                    new Date(date).toLocaleDateString(),
                            },
                        ]}
                        pagination={false}
                    />
                </Card>
            </div>
        );
    };

    const renderAnalystManagerDashboard = () => {
        if (!dashboardData) return null;

        const {
            total_visits,
            total_completed,
            total_pending,
            brands_progress,
            promoters_progress,
            stores_progress,
        } = dashboardData;

        const chartData = brands_progress.map((brand) => ({
            name: brand.brand_name,
            completed: brand.visits_done,
            pending: brand.visits_pending,
            total: brand.total_visits,
        }));

        return (
            <div className="analyst-manager-dashboard">
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title={t("dashboard:stats.totalVisits")}
                                value={total_visits}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title={t("dashboard:stats.completedVisits")}
                                value={total_completed}
                                valueStyle={{ color: "#3f8600" }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title={t("dashboard:stats.pendingVisits")}
                                value={total_pending}
                                valueStyle={{ color: "#cf1322" }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card title={t("dashboard:brandProgress")} className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="completed"
                                name={t("dashboard:chart.completed")}
                                fill="#3f8600"
                            />
                            <Bar
                                dataKey="pending"
                                name={t("dashboard:chart.pending")}
                                fill="#cf1322"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Row gutter={[16, 16]} className="mt-4">
                    <Col span={12}>
                        <Card title={t("dashboard:promoterProgress")}>
                            <Table
                                dataSource={promoters_progress}
                                columns={[
                                    {
                                        title: t("dashboard:table.promoter"),
                                        dataIndex: "promoter_name",
                                    },
                                    {
                                        title: t("dashboard:table.progress"),
                                        render: (_, record) => (
                                            <Progress
                                                percent={Math.round(
                                                    (record.visits_done /
                                                        record.total_visits) *
                                                        100
                                                )}
                                                format={(percent) =>
                                                    `${record.visits_done}/${record.total_visits}`
                                                }
                                            />
                                        ),
                                    },
                                ]}
                                pagination={false}
                            />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title={t("dashboard:storeProgress")}>
                            <Table
                                dataSource={stores_progress}
                                columns={[
                                    {
                                        title: t("dashboard:table.store"),
                                        render: (_, record) =>
                                            `${record.store_name.toUpperCase()} - ${record.store_number}`,
                                    },
                                    {
                                        title: t("dashboard:table.progress"),
                                        render: (_, record) => (
                                            <Progress
                                                percent={Math.round(
                                                    (record.visits_done /
                                                        record.total_visits) *
                                                        100
                                                )}
                                                format={(percent) =>
                                                    `${record.visits_done}/${record.total_visits}`
                                                }
                                            />
                                        ),
                                    },
                                ]}
                                pagination={false}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    const renderDashboardByRole = () => {
        switch (user.role) {
            case 1: // Promoter
                return renderPromoterDashboard();
            case 2: // Analyst
            case 3: // Manager
                return renderAnalystManagerDashboard();
            default:
                return null;
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="dashboard">
            <h1>{t("dashboard:title")}</h1>
            {renderDashboardByRole()}
        </div>
    );
};

export default Dashboard;
