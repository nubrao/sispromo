import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Card,
    Table,
    Button,
    Form,
    Select,
    Space,
    Popconfirm,
    Input,
    Row,
    Col,
    Tag,
    Modal,
} from "antd";
import { PlusOutlined, SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { useCache } from "../hooks/useCache";
import { Toast } from "../components/Toast";
import Loader from "../components/Loader";
import VisitForm from "../components/visits/VisitForm";
import api from "../services/api";

const { Search } = Input;

const VISIT_STATUS = {
    PENDING: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4,
};

const VISIT_STATUS_COLORS = {
    [VISIT_STATUS.PENDING]: "orange",
    [VISIT_STATUS.IN_PROGRESS]: "blue",
    [VISIT_STATUS.COMPLETED]: "green",
    [VISIT_STATUS.CANCELLED]: "red",
};

const Visits = () => {
    const { t } = useTranslation(["visits", "common"]);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [loading, setLoading] = useState(false);

    // Usando o hook useCache para carregar os dados
    const {
        data: visitsData,
        loading: loadingVisits,
        error: visitsError,
    } = useCache(
        "/api/visits/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () => Toast.error(t("visits:messages.error.load")),
        }
    );

    const {
        data: promotersData,
        loading: loadingPromoters,
        error: promotersError,
    } = useCache(
        "/api/users/",
        { role: 1 }, // Filtra apenas promotores
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () =>
                Toast.error(t("visits:messages.error.load_promoters")),
        }
    );

    const {
        data: storesData,
        loading: loadingStores,
        error: storesError,
    } = useCache(
        "/api/stores/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () => Toast.error(t("visits:messages.error.load_stores")),
        }
    );

    const {
        data: brandsData,
        loading: loadingBrands,
        error: brandsError,
    } = useCache(
        "/api/brands/",
        {},
        {
            ttl: 30 * 60 * 1000, // 30 minutos
            onError: () => Toast.error(t("visits:messages.error.load_brands")),
        }
    );

    // Processando os dados usando useMemo para evitar recálculos desnecessários
    const allPromoters = useMemo(() => promotersData || [], [promotersData]);
    const allStores = useMemo(() => storesData || [], [storesData]);
    const allBrands = useMemo(() => brandsData || [], [brandsData]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/visits/${id}/`);
            Toast.success(t("visits:messages.success.delete"));
            // Recarrega os dados do cache
            window.location.reload();
        } catch (error) {
            Toast.error(t("visits:messages.error.delete"));
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleFilter = () => {
        const values = form.getFieldsValue();
        const filteredData = visitsData.filter((visit) => {
            const searchMatch = searchTerm
                ? visit.promoter.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                  visit.store.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                  visit.brand.brand_name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                : true;

            const promoterMatch =
                !values.promoter || visit.promoter.id === values.promoter;
            const storeMatch = !values.store || visit.store.id === values.store;
            const brandMatch =
                !values.brand || visit.brand.brand_id === values.brand;
            const statusMatch =
                !values.status || visit.status === values.status;

            return (
                searchMatch &&
                promoterMatch &&
                storeMatch &&
                brandMatch &&
                statusMatch
            );
        });

        return filteredData;
    };

    const clearFilters = () => {
        form.resetFields();
        setSearchTerm("");
    };

    const handleEdit = (visit) => {
        setEditingVisit(visit);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setEditingVisit(null);
    };

    const columns = [
        {
            title: t("visits:list.columns.promoter"),
            dataIndex: ["promoter", "name"],
            key: "promoter_name",
            sorter: (a, b) => a.promoter.name.localeCompare(b.promoter.name),
        },
        {
            title: t("visits:list.columns.store"),
            dataIndex: ["store", "name"],
            key: "store_name",
            render: (text, record) =>
                `${text} - ${record.store.number || "S/N"}`,
            sorter: (a, b) => a.store.name.localeCompare(b.store.name),
        },
        {
            title: t("visits:list.columns.brand"),
            dataIndex: ["brand", "brand_name"],
            key: "brand_name",
            sorter: (a, b) =>
                a.brand.brand_name.localeCompare(b.brand.brand_name),
        },
        {
            title: t("visits:list.columns.date"),
            dataIndex: "visit_date",
            key: "visit_date",
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.visit_date) - new Date(b.visit_date),
        },
        {
            title: t("visits:list.columns.status"),
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={VISIT_STATUS_COLORS[status]}>
                    {t(`visits:status.${status}`)}
                </Tag>
            ),
            filters: Object.entries(VISIT_STATUS).map(([key, value]) => ({
                text: t(`visits:status.${value}`),
                value: value,
            })),
            onFilter: (value, record) => record.status === value,
        },
        {
            title: t("visits:list.columns.price"),
            dataIndex: "total_price",
            key: "total_price",
            render: (price) => `R$ ${parseFloat(price).toFixed(2)}`,
            sorter: (a, b) => a.total_price - b.total_price,
        },
        {
            title: t("common:table.actions.title"),
            key: "actions",
            className: "ant-table-cell-actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleEdit(record)}
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
                        <Button
                            type="primary"
                            danger
                            className="form-button delete-button"
                        >
                            {t("common:table.actions.delete")}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Se houver erro em alguma das requisições principais
    if (visitsError || promotersError || storesError || brandsError) {
        return <div>Erro ao carregar dados. Por favor, tente novamente.</div>;
    }

    // Se estiver carregando os dados principais
    if (loadingVisits || loadingPromoters || loadingStores || loadingBrands) {
        return <Loader />;
    }

    const filteredVisits = handleFilter();

    return (
        <Card title={t("visits:title")} className="form-title">
            <Space direction="vertical" style={{ width: "100%" }}>
                <Form form={form} layout="vertical" className="form">
                    <Row gutter={16} className="search-row">
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="promoter"
                                label={t("visits:filters.promoter")}
                                className="form-input"
                            >
                                <Select
                                    allowClear
                                    placeholder={t(
                                        "visits:filters.placeholders.promoter"
                                    )}
                                    options={allPromoters.map((p) => ({
                                        value: p.id,
                                        label: p.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="store"
                                label={t("visits:filters.store")}
                                className="form-input"
                            >
                                <Select
                                    allowClear
                                    placeholder={t(
                                        "visits:filters.placeholders.store"
                                    )}
                                    options={allStores.map((s) => ({
                                        value: s.id,
                                        label: `${s.name} - ${s.number}`,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="brand"
                                label={t("visits:filters.brand")}
                                className="form-input"
                            >
                                <Select
                                    allowClear
                                    placeholder={t(
                                        "visits:filters.placeholders.brand"
                                    )}
                                    options={allBrands.map((b) => ({
                                        value: b.brand_id,
                                        label: b.brand_name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item
                                name="status"
                                label={t("visits:filters.status")}
                                className="form-input"
                            >
                                <Select
                                    allowClear
                                    placeholder={t(
                                        "visits:filters.placeholders.status"
                                    )}
                                    options={Object.entries(VISIT_STATUS).map(
                                        ([key, value]) => ({
                                            value: value,
                                            label: t(`visits:status.${value}`),
                                        })
                                    )}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="search"
                                label={t("visits:filters.search")}
                                className="form-input"
                            >
                                <Search
                                    placeholder={t("visits:search.placeholder")}
                                    onSearch={handleSearch}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    prefix={<SearchOutlined />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Button
                                type="default"
                                icon={<ClearOutlined />}
                                onClick={clearFilters}
                                className="form-button clear-button"
                            >
                                {t("common:buttons.clear_filters")}
                            </Button>
                        </Col>
                    </Row>
                </Form>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingVisit(null);
                        setModalVisible(true);
                    }}
                    className="form-button"
                >
                    {t("visits:buttons.new")}
                </Button>

                <Table
                    dataSource={filteredVisits}
                    columns={columns}
                    loading={loadingVisits}
                    rowKey="id"
                    pagination={{
                        total: filteredVisits.length,
                        pageSize: 10,
                        showTotal: (total) =>
                            t("common:table.pagination.total", { total }),
                    }}
                />

                <Modal
                    title={
                        editingVisit
                            ? t("visits:form.edit_title")
                            : t("visits:form.create_title")
                    }
                    open={modalVisible}
                    onCancel={handleModalClose}
                    footer={null}
                    width={800}
                >
                    <VisitForm
                        promoterId={editingVisit?.promoter?.id}
                        setPromoterId={() => {}}
                        storeId={editingVisit?.store?.id}
                        setStoreId={() => {}}
                        brand={
                            editingVisit?.brand || {
                                brand_id: "",
                                brand_name: "",
                            }
                        }
                        setBrand={() => {}}
                        visitDate={editingVisit?.visit_date}
                        setVisitDate={() => {}}
                        promoters={allPromoters}
                        stores={allStores}
                        brands={allBrands}
                        handleSubmit={handleModalClose}
                        isPromoter={false}
                        filteredStores={allStores}
                        isEditing={!!editingVisit}
                        loading={loading}
                    />
                </Modal>
            </Space>
        </Card>
    );
};

export default Visits;
