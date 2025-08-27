import { useEffect, useState } from 'react';
import { Card, Table, Statistic, Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Loader from '../components/Loader';
import api from '../services/api';
import '../styles/dashboard.css';

const Dashboard = () => {
    const { t } = useTranslation(["dashboard", "common"]);
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
                await new Promise(resolve => setTimeout(resolve, 1000));
                return loadDashboardData(retryCount + 1);
            }

            setError(error.message || t("dashboard:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;
    if (error) return <div>{error}</div>;
    if (!dashboardData) return null;

    const {
        total_visits = 0,
        total_completed = 0,
        total_pending = 0,
        brands_progress = [],
        promoters_progress = [],
        stores_progress = [],
    } = dashboardData;

    return (
        <Card title={t("dashboard:title")} className="dashboard-title">
            <div className="stats-section">
                <Card className="stats-card">
                    <Statistic title={t("dashboard:stats.totalVisits")} value={total_visits} />
                </Card>
                <Card className="stats-card">
                    <Statistic
                        title={t("dashboard:stats.completedVisits")}
                        value={total_completed}
                        valueStyle={{ color: "#3f8600" }}
                    />
                </Card>
                <Card className="stats-card">
                    <Statistic
                        title={t("dashboard:stats.pendingVisits")}
                        value={total_pending}
                        valueStyle={{ color: "#cf1322" }}
                    />
                </Card>
            </div>

            <Card className="brand-section" title={t("dashboard:brandProgress")}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={brands_progress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="brand_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                            dataKey="visits_done"
                            name={t("dashboard:chart.completed")}
                            fill="#3f8600"
                        />
                        <Bar
                            dataKey="visits_pending"
                            name={t("dashboard:chart.pending")}
                            fill="#cf1322"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <div className="progress-section">
                <Card className="promoter-progress" title={t("dashboard:promoterProgress")}>
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
                                        percent={Math.round((record.visits_done / record.total_visits) * 100)}
                                        format={() => `${record.visits_done}/${record.total_visits}`}
                                    />
                                ),
                            },
                        ]}
                        pagination={false}
                    />
                </Card>
                <Card className="store-progress" title={t("dashboard:storeProgress")}>
                    <Table
                        dataSource={stores_progress}
                        columns={[
                            {
                                title: t("dashboard:table.store"),
                                render: (_, record) =>
                                    `${record.store_name?.toUpperCase() || ""} - ${record.store_number || ""}`,
                            },
                            {
                                title: t("dashboard:table.progress"),
                                render: (_, record) => (
                                    <Progress
                                        percent={Math.round((record.visits_done / record.total_visits) * 100)}
                                        format={() => `${record.visits_done}/${record.total_visits}`}
                                    />
                                ),
                            },
                        ]}
                        pagination={false}
                    />
                </Card>
            </div>
        </Card>
    );
};

export default Dashboard;
