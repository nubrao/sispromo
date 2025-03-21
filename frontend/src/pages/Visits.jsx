import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Card,
    Table,
    Button,
    Form,
    Select,
    DatePicker,
    Space,
    Modal,
} from "antd";
import {
    PlusOutlined,
    FilterOutlined,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import api from "../services/api";

const Visits = () => {
    const { t } = useTranslation(["visits", "common"]);
    const [form] = Form.useForm();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        loadVisits();
        loadPromoters();
        loadStores();
        loadBrands();
    }, []);

    const loadVisits = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/visits/", { params: filters });
            setVisits(response.data);
            } catch (error) {
            toast.error(t("visits:messages.error.load"));
            } finally {
                setLoading(false);
        }
    };

    const loadPromoters = async () => {
        try {
            const response = await api.get("/api/promoters/");
            setPromoters(response.data);
        } catch (error) {
            console.error("Error loading promoters:", error);
        }
    };

    const loadStores = async () => {
        try {
            const response = await api.get("/api/stores/");
            setStores(response.data);
        } catch (error) {
            console.error("Error loading stores:", error);
        }
    };

    const loadBrands = async () => {
        try {
            const response = await api.get("/api/brands/");
            setBrands(response.data);
        } catch (error) {
            console.error("Error loading brands:", error);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const data = {
                ...values,
                date: values.date.format("YYYY-MM-DD"),
            };

            if (editingVisit) {
                await api.patch(`/api/visits/${editingVisit.id}/`, data);
                toast.success(t("visits:messages.success.update"));
            } else {
                await api.post("/api/visits/", data);
                toast.success(t("visits:messages.success.create"));
            }

            setModalVisible(false);
            form.resetFields();
            setEditingVisit(null);
            loadVisits();
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                (editingVisit
                    ? t("visits:messages.error.update")
                    : t("visits:messages.error.create"));
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (visit) => {
        try {
            await api.delete(`/api/visits/${visit.id}/`);
            toast.success(t("visits:messages.success.delete"));
            loadVisits();
        } catch (error) {
            toast.error(t("visits:messages.error.delete"));
        }
    };

    const handleEdit = (visit) => {
        setEditingVisit(visit);
        form.setFieldsValue({
            ...visit,
            date: dayjs(visit.date),
        });
        setModalVisible(true);
    };

    const handleFilter = (values) => {
        const filters = {};
        if (values.promoter) filters.promoter = values.promoter;
        if (values.store) filters.store = values.store;
        if (values.brand) filters.brand = values.brand;
        if (values.date) filters.date = values.date.format("YYYY-MM-DD");
        setFilters(filters);
        loadVisits();
    };

    const columns = [
        {
            title: t("visits:list.columns.promoter"),
            dataIndex: ["promoter", "name"],
            key: "promoter",
        },
        {
            title: t("visits:list.columns.store"),
            dataIndex: ["store", "name"],
            key: "store",
        },
        {
            title: t("visits:list.columns.brand"),
            dataIndex: ["brand", "name"],
            key: "brand",
        },
        {
            title: t("visits:list.columns.date"),
            dataIndex: "date",
            key: "date",
            render: (date) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: t("visits:list.columns.actions"),
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card title={t("visits:title")}>
                <Form
                    layout="inline"
                    onFinish={handleFilter}
                    style={{ marginBottom: 16 }}
                >
                    <Form.Item
                        name="promoter"
                        label={t("visits:filters.promoter")}
                    >
                        <Select
                            allowClear
                            style={{ width: 200 }}
                            options={promoters.map((p) => ({
                                value: p.id,
                                label: p.name,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="store" label={t("visits:filters.store")}>
                        <Select
                            allowClear
                            style={{ width: 200 }}
                            options={stores.map((s) => ({
                                value: s.id,
                                label: s.name,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="brand" label={t("visits:filters.brand")}>
                        <Select
                            allowClear
                            style={{ width: 200 }}
                            options={brands.map((b) => ({
                                value: b.id,
                                label: b.name,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="date" label={t("visits:filters.date")}>
                        <DatePicker />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<FilterOutlined />}
                            >
                                {t("visits:form.buttons.filter")}
                            </Button>
                            <Button
                                onClick={() => {
                                    form.resetFields();
                                    setFilters({});
                                    loadVisits();
                                }}
                            >
                                {t("visits:form.buttons.clearFilters")}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        form.resetFields();
                        setEditingVisit(null);
                        setModalVisible(true);
                    }}
                    style={{ marginBottom: 16 }}
                >
                    {t("visits:form.title.create")}
                </Button>

                <Table
                    dataSource={visits}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    locale={{ emptyText: t("visits:list.empty") }}
                />

                <Modal
                    title={
                        editingVisit
                            ? t("visits:form.title.edit")
                            : t("visits:form.title.create")
                    }
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        form.resetFields();
                        setEditingVisit(null);
                    }}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="promoter"
                            label={t("visits:form.fields.promoter.label")}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        "visits:form.fields.promoter.required"
                                    ),
                                },
                            ]}
                        >
                            <Select
                                placeholder={t(
                                    "visits:form.fields.promoter.placeholder"
                                )}
                                options={promoters.map((p) => ({
                                    value: p.id,
                                    label: p.name,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            name="store"
                            label={t("visits:form.fields.store.label")}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        "visits:form.fields.store.required"
                                    ),
                                },
                            ]}
                        >
                            <Select
                                placeholder={t(
                                    "visits:form.fields.store.placeholder"
                                )}
                                options={stores.map((s) => ({
                                    value: s.id,
                                    label: s.name,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            name="brand"
                            label={t("visits:form.fields.brand.label")}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        "visits:form.fields.brand.required"
                                    ),
                                },
                            ]}
                        >
                            <Select
                                placeholder={t(
                                    "visits:form.fields.brand.placeholder"
                                )}
                                options={brands.map((b) => ({
                                    value: b.id,
                                    label: b.name,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            name="date"
                            label={t("visits:form.fields.date.label")}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        "visits:form.fields.date.required"
                                    ),
                                },
                            ]}
                        >
                            <DatePicker
                                placeholder={t(
                                    "visits:form.fields.date.placeholder"
                                )}
                                style={{ width: "100%" }}
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
                                        ? t("visits:form.buttons.processing")
                                        : t("visits:form.buttons.save")}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setModalVisible(false);
                                        form.resetFields();
                                        setEditingVisit(null);
                                    }}
                                >
                                    {t("visits:form.buttons.cancel")}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default Visits;
