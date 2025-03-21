import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Space, Table } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { formatCNPJ } from "../utils/formatters";
import api from "../services/api";

const StoreForm = () => {
    const { t } = useTranslation(["stores", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const [filterName, setFilterName] = useState("");
    const [filterCNPJ, setFilterCNPJ] = useState("");

    useEffect(() => {
        loadStores();
        if (id) {
            loadStore();
        }
    }, [id]);

    const loadStores = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/stores/");
            setStores(response.data);
        } catch (error) {
            toast.error(t("stores:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const loadStore = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/stores/${id}/`);
            form.setFieldsValue({
                ...response.data,
                cnpj: formatCNPJ(response.data.cnpj),
            });
        } catch (error) {
            toast.error(t("stores:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const data = {
                ...values,
                cnpj: values.cnpj.replace(/\D/g, ""),
            };

            if (id) {
                await api.patch(`/api/stores/${id}/`, data);
                toast.success(t("stores:messages.success.update"));
            } else {
                await api.post("/api/stores/", data);
                toast.success(t("stores:messages.success.create"));
            }
            navigate("/stores");
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                (id
                    ? t("stores:messages.error.update")
                    : t("stores:messages.error.create"));
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (storeId) => {
        try {
            await api.delete(`/api/stores/${storeId}/`);
            toast.success(t("stores:messages.success.delete"));
            loadStores();
        } catch (error) {
            toast.error(t("stores:messages.error.delete"));
        }
    };

    const handleCNPJChange = (e) => {
        const { value } = e.target;
        form.setFieldsValue({
            cnpj: formatCNPJ(value),
        });
    };

    const filteredStores = stores.filter((store) => {
        const matchName = store.name
            .toLowerCase()
            .includes(filterName.toLowerCase());
        const matchCNPJ = store.cnpj.includes(filterCNPJ.replace(/\D/g, ""));
        return matchName && matchCNPJ;
    });

    const columns = [
        {
            title: t("stores:list.columns.name"),
            dataIndex: "name",
            key: "name",
        },
        {
            title: t("stores:list.columns.cnpj"),
            dataIndex: "cnpj",
            key: "cnpj",
            render: (cnpj) => formatCNPJ(cnpj),
        },
        {
            title: t("stores:list.columns.address"),
            dataIndex: "address",
            key: "address",
        },
        {
            title: t("stores:list.columns.city"),
            dataIndex: "city",
            key: "city",
        },
        {
            title: t("stores:list.columns.state"),
            dataIndex: "state",
            key: "state",
        },
        {
            title: t("stores:list.columns.actions"),
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        onClick={() => navigate(`/stores/edit/${record.id}`)}
                    >
                        {t("stores:buttons.edit")}
                    </Button>
                    <Button danger onClick={() => handleDelete(record.id)}>
                        {t("stores:buttons.delete")}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card
                title={
                    id
                        ? t("stores:form.title.edit")
                        : t("stores:form.title.create")
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ maxWidth: 600 }}
                >
                    <Form.Item
                        name="name"
                        label={t("stores:form.fields.name.label")}
                        rules={[
                            {
                                required: true,
                                message: t("stores:form.fields.name.required"),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.name.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="cnpj"
                        label={t("stores:form.fields.cnpj.label")}
                        rules={[
                            {
                                required: true,
                                message: t("stores:form.fields.cnpj.required"),
                            },
                            {
                                pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                                message: t("stores:form.fields.cnpj.invalid"),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.cnpj.placeholder"
                            )}
                            onChange={handleCNPJChange}
                            maxLength={18}
                        />
                    </Form.Item>

                    <Form.Item
                        name="address"
                        label={t("stores:form.fields.address.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "stores:form.fields.address.required"
                                ),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.address.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="city"
                        label={t("stores:form.fields.city.label")}
                        rules={[
                            {
                                required: true,
                                message: t("stores:form.fields.city.required"),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.city.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="state"
                        label={t("stores:form.fields.state.label")}
                        rules={[
                            {
                                required: true,
                                message: t("stores:form.fields.state.required"),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.state.placeholder"
                            )}
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
                                    ? t("stores:buttons.processing")
                                    : t("stores:buttons.save")}
                            </Button>
                            <Button onClick={() => navigate("/stores")}>
                                {t("stores:buttons.cancel")}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {!id && (
                <Card title={t("stores:list.title")} style={{ marginTop: 24 }}>
                    <Space style={{ marginBottom: 16 }}>
                        <Input
                            placeholder={t("stores:list.filters.name")}
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                        />
                        <Input
                            placeholder={t("stores:list.filters.cnpj")}
                            value={filterCNPJ}
                            onChange={(e) =>
                                setFilterCNPJ(formatCNPJ(e.target.value))
                            }
                            maxLength={18}
                        />
                    </Space>

                    <Table
                        dataSource={filteredStores}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        locale={{ emptyText: t("stores:list.empty") }}
                    />
                </Card>
            )}
        </div>
    );
};

export default StoreForm;
