import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Table, Button, Space, Popconfirm, Input, Form, Row, Col, Select } from "antd";
import { PlusOutlined, SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { useCache } from "../hooks/useCache";
import { Toast } from "../components/Toast";
import Loader from "../components/Loader";
import api from "../services/api";

const { Search } = Input;

const VisitPrices = () => {
    const { t } = useTranslation(["visitPrices", "common"]);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState("");

    // Usando o hook useCache para carregar os dados
    const {
        data: prices,
        loading: loadingPrices,
        error: pricesError,
    } = useCache(
        "/api/visit-prices/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () => Toast.error(t("visitPrices:messages.error.load")),
        }
    );

    const {
        data: brands,
        loading: loadingBrands,
        error: brandsError,
    } = useCache(
        "/api/brands/",
        {},
        {
            ttl: 30 * 60 * 1000, // 30 minutos
            onError: () => Toast.error(t("visitPrices:messages.error.load_brands")),
        }
    );

    const {
        data: stores,
        loading: loadingStores,
        error: storesError,
    } = useCache(
        "/api/stores/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () => Toast.error(t("visitPrices:messages.error.load_stores")),
        }
    );

    // Processando os dados usando useMemo para evitar recálculos desnecessários
    const allBrands = useMemo(() => brands || [], [brands]);
    const allStores = useMemo(() => stores || [], [stores]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/visit-prices/${id}/`);
            Toast.success(t("visitPrices:messages.success.delete"));
            // Recarrega os dados do cache
            window.location.reload();
        } catch (error) {
            Toast.error(t("visitPrices:messages.error.delete"));
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleFilter = () => {
        const values = form.getFieldsValue();
        const filteredData = prices.filter((price) => {
            const searchMatch = searchTerm ? (
                price.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                price.store_name.toLowerCase().includes(searchTerm.toLowerCase())
            ) : true;

            const brandMatch = !values.brand || price.brand === values.brand;
            const storeMatch = !values.store || price.store === values.store;

            return searchMatch && brandMatch && storeMatch;
        });

        return filteredData;
    };

    const clearFilters = () => {
        form.resetFields();
        setSearchTerm("");
    };

    const columns = [
        {
            title: t("visitPrices:list.columns.brand"),
            dataIndex: "brand_name",
            key: "brand_name",
            sorter: (a, b) => a.brand_name.localeCompare(b.brand_name),
        },
        {
            title: t("visitPrices:list.columns.store"),
            dataIndex: "store_name",
            key: "store_name",
            render: (text, record) =>
                `${text} - ${record.store_number || "S/N"}`,
            sorter: (a, b) => a.store_name.localeCompare(b.store_name),
        },
        {
            title: t("visitPrices:list.columns.price"),
            dataIndex: "price",
            key: "price",
            render: (price) => `R$ ${parseFloat(price).toFixed(2)}`,
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: t("common:table.actions.title"),
            key: "actions",
            className: "ant-table-cell-actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() =>
                            navigate(`/visit-prices/edit/${record.id}`)
                        }
                        className="form-button edit-button"
                    >
                        {t("common:table.actions.edit")}
                    </Button>
                    <Popconfirm
                        title={t("common:messages.confirm.delete")}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("common:table.actions.confirm")}
                        cancelText={t("common:table.actions.cancel")}
                    >
                        <Button type="primary" danger className="form-button delete-button">
                            {t("common:table.actions.delete")}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Se houver erro em alguma das requisições principais
    if (pricesError || brandsError || storesError) {
        return <div>Erro ao carregar dados. Por favor, tente novamente.</div>;
    }

    // Se estiver carregando os dados principais
    if (loadingPrices || loadingBrands || loadingStores) {
        return <Loader />;
    }

    const filteredPrices = handleFilter();

    return (
        <Card title={t("visitPrices:title")} className="form-title">
            <Space direction="vertical" style={{ width: "100%" }}>
                <Form form={form} layout="vertical" className="form">
                    <Row gutter={16} className="search-row">
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="brand"
                                label={t("visitPrices:filters.brand")}
                                className="form-input"
                            >
                                <Select
                                    allowClear
                                    placeholder={t("visitPrices:filters.placeholders.brand")}
                                    options={allBrands.map((b) => ({
                                        value: b.brand_id,
                                        label: b.brand_name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="store"
                                label={t("visitPrices:filters.store")}
                                className="form-input"
                            >
                                <Select
                                    allowClear
                                    placeholder={t("visitPrices:filters.placeholders.store")}
                                    options={allStores.map((s) => ({
                                        value: s.id,
                                        label: `${s.name} - ${s.number}`,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="search"
                                label={t("visitPrices:filters.search")}
                                className="form-input"
                            >
                                <Search
                                    placeholder={t("visitPrices:search.placeholder")}
                                    onSearch={handleSearch}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    prefix={<SearchOutlined />}
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

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/visit-prices/new")}
                    className="form-button"
                >
                    {t("visitPrices:buttons.new")}
                </Button>

                <Table
                    dataSource={filteredPrices}
                    columns={columns}
                    loading={loadingPrices}
                    rowKey="id"
                    pagination={{
                        total: filteredPrices.length,
                        pageSize: 10,
                        showTotal: (total) =>
                            t("common:table.pagination.total", { total }),
                    }}
                />
            </Space>
        </Card>
    );
};

export default VisitPrices;
