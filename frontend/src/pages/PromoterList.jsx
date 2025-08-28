import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Space, Card, Button, Input, Select, Table, Tag, Row, Col } from "antd";
import { PlusOutlined, SearchOutlined, ClearOutlined, EditOutlined } from "@ant-design/icons";
import ErrorBoundary from "../components/ErrorBoundary";
import api from "../services/api";
import Toast from "../components/Toast";
import { formatPhone } from "../utils/formatters";

const PromoterListWithErrorBoundary = () => {
    const { t } = useTranslation(["common"]);

    return (
        <ErrorBoundary
            errorTitle={t("common:messages.error.title")}
            errorDescription={t("common:messages.error.description")}
            reloadButtonText={t("common:buttons.reload")}
            backButtonText={t("common:buttons.back")}
        >
            <PromoterList />
        </ErrorBoundary>
    );
}

const PromoterList = () => {
    const { t } = useTranslation(["promoters", "common"]);
    const navigate = useNavigate();
    const location = useLocation();
    const [filteredPromoters, setFilteredPromoters] = useState([]);
    const [searchForm] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableBrands, setAvailableBrands] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Add cache-busting query parameter
            const timestamp = Date.now();

            // Fetch fresh data from the database
            const [promoters, promoterBrands] = await Promise.all([
                api.get(`/api/users/?_t=${timestamp}`),
                api.get(`/api/promoter-brands/?_t=${timestamp}`)
            ]);

            // Map brands to promoters
            const promotersWithBrands = promoters.data.map(promoter => {
                const brands = promoterBrands.data
                    .filter(pb => pb.promoter?.id === promoter.id)
                    .map(pb => ({
                        brand_id: pb.brand.brand_id,
                        brand_name: pb.brand.brand_name
                    }));

                return {
                    ...promoter,
                    brands: brands || []
                };
            });

            setFilteredPromoters(promotersWithBrands);

            // Extract unique brands for the filter
            const uniqueBrands = [...new Set(
                promoterBrands.data
                    .map(pb => pb.brand)
                    .filter(Boolean)
                    .map(brand => JSON.stringify(brand))
            )].map(str => JSON.parse(str));

            setAvailableBrands(uniqueBrands);

        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error);
            Toast.error(t("promoters:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Always fetch fresh data when mounting
        fetchData();
    }, []);

    useEffect(() => {
        if (location.state?.refresh || location.state?.forceRefresh) {
            fetchData();
            // Clear navigation state after fetch
            navigate(location.pathname, {
                replace: true,
                state: {}
            });
        }
    }, [location.state?.refresh, location.state?.forceRefresh]);

    const columns = [
        {
            title: t("promoters:table.name"),
            dataIndex: "first_name",
            width: 150,
            render: (_, record) => `${record.first_name} ${record.last_name}`,
        },
        {
            title: t("promoters:table.email"),
            dataIndex: "email",
            key: "email",
            width: 180,
        },
        {
            title: t("promoters:table.phone"),
            dataIndex: "phone",
            key: "phone",
            width: 150,
            render: (phone) => formatPhone(phone),
        },
        {
            title: t("promoters:table.brands"),
            dataIndex: "brands",
            key: "brands",
            width: 250,
            render: (_, record) => (
                <Space size={[0, 8]} wrap>
                    {record.brands?.map((brand) => (
                        <Tag
                            key={`${record.id}-${brand.brand_id}`}
                            color="blue"
                        >
                            {brand.brand_name.toUpperCase()}
                        </Tag>
                    )) || []}
                </Space>
            ),
        },
        {
            title: t("promoters:list.columns.username"),
            dataIndex: "username",
            key: "username",
            width: 120,
        },
        {
            title: t("promoters:table.actions"),
            key: "actions",
            width: 120,
            className: "ant-table-cell-actions",
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="form-button edit-button"
                    >
                        {t("promoters:buttons.edit")}
                    </Button>
                </Space>
            ),
        },
    ];

    const handleEdit = (record) => {
        navigate(`/promoters/${record.id}/edit`);
    };

    const clearFilters = () => {
        searchForm.resetFields();
        fetchData();
    };

    const handleSearch = () => {
        const values = searchForm.getFieldsValue();
        const filtered = filteredPromoters.filter(promoter => {
            const nameMatch = !values.name ||
                `${promoter.first_name} ${promoter.last_name}`
                    .toLowerCase()
                    .includes(values.name.toLowerCase());

            const phoneMatch = !values.phone ||
                promoter.phone.includes(values.phone.replace(/\D/g, ''));

            const brandMatch = !values.brand?.length ||
                promoter.brands.some(brand => values.brand.includes(brand.brand_id));

            return nameMatch && phoneMatch && brandMatch;
        });

        setFilteredPromoters(filtered);
    };

    if (error) {
        return <div>{t("promoters:messages.error.load")}</div>;
    }

    return (
        <Card title={t("promoters:title")} className="form-title">
            <Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/promoters/new")}
                    className="form-button"
                >
                    {t("promoters:buttons.new")}
                </Button>
            </Space>
            <Form form={searchForm} layout="vertical" className="form">
                <Row gutter={16} className="search-row ">
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="name"
                            label={t("promoters:search.name")}
                            className="form-input"
                        >
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder={t("promoters:search.name")}
                                allowClear
                                onChange={(e) => {
                                    searchForm.setFieldValue(
                                        "name",
                                        e.target.value
                                    );
                                    handleSearch();
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="phone"
                            label={t("promoters:search.phone")}
                            className="form-input"
                        >
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder={t("promoters:search.phone")}
                                allowClear
                                onChange={(e) => {
                                    searchForm.setFieldValue(
                                        "phone",
                                        e.target.value
                                    );
                                    handleSearch();
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="brand"
                            label={t("promoters:filters.brand")}
                            className="form-input"
                        >
                            <Select
                                mode="multiple"
                                allowClear
                                placeholder={t(
                                    "promoters:filters.placeholders.brand"
                                )}
                                options={availableBrands.map((brand) => ({
                                    value: brand.id,
                                    label: brand.brand_name.toUpperCase(),
                                }))}
                                onChange={(value) => {
                                    searchForm.setFieldValue(
                                        "brand",
                                        value
                                    );
                                    handleSearch();
                                }}
                                maxTagCount={2}
                                maxTagTextLength={10}
                                loading={loading}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Button
                    type="default"
                    icon={<ClearOutlined />}
                    onClick={clearFilters}
                    className="form-button clear-button"
                >
                    {t("common:buttons.clear_filters")}
                </Button>
            </Form>

            <Table
                bordered
                columns={columns}
                dataSource={filteredPromoters}
                rowKey="id"
                loading={loading}
                tableLayout="fixed"
                rowClassName="editable-row"
            />
        </Card>
    );
};

export default PromoterListWithErrorBoundary;
