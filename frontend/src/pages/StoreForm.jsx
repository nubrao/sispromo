import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Space, Table } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { formatCNPJ } from "../utils/formatters";
import storeRepository from "../repositories/storeRepository";

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
        if (id) {
            loadStore();
        }
    }, [id]);

    const loadStore = async () => {
        try {
            setLoading(true);
            const response = await storeRepository.getStore(id);
            form.setFieldsValue({
                ...response,
                cnpj: formatCNPJ(response.cnpj),
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
                await storeRepository.updateStore(id, data);
                toast.success(t("stores:messages.success.update"));
            } else {
                await storeRepository.createStore(data);
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
            await storeRepository.deleteStore(storeId);
            toast.success(t("stores:messages.success.delete"));
            loadStores();
        } catch (error) {
            toast.error(t("stores:messages.error.delete"));
        }
    };

    const handleCNPJChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 14) {
            form.setFieldsValue({
                cnpj: formatCNPJ(value),
            });
        }
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
        <>
            <Card
                title={
                    id
                        ? t("stores:form.title.edit")
                        : t("stores:form.title.create")
                }
                className="form-title"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="form"
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
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.name.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="number"
                        label={t("stores:form.fields.number.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "stores:form.fields.number.required"
                                ),
                            },
                        ]}
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.number.placeholder"
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
                        className="form-input"
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
                        name="city"
                        label={t("stores:form.fields.city.label")}
                        rules={[
                            {
                                required: true,
                                message: t("stores:form.fields.city.required"),
                            },
                        ]}
                        className="form-input"
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
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "stores:form.fields.state.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item className="form-actions">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="form-button"
                            >
                                {id
                                    ? t("common:buttons.update")
                                    : t("common:buttons.create_store")}
                            </Button>
                            <Button
                                onClick={() => navigate("/stores")}
                                className="form-button clear-button"
                            >
                                {t("common:buttons.cancel")}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </>
    );
};

export default StoreForm;
