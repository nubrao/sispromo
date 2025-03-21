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

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/dashboard/");
            setDashboardData(response.data);
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
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
                                    `${record.store__name} - ${record.store__number}`,
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

    const renderManagerDashboard = () => {
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
            <div className="manager-dashboard">
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
                                            `${record.store_name} - ${record.store_number}`,
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

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="dashboard">
            <h1>{t("dashboard:title")}</h1>
            {user.role === 1
                ? renderPromoterDashboard()
                : renderManagerDashboard()}
        </div>
    );
};

export default Dashboard;
