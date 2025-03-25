import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Space } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { formatCNPJ } from "../utils/formatters";
import api from "../services/api";
import "../styles/store.css";

const StoreForm = () => {
    const { t } = useTranslation(["stores", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadStore();
        }
    }, [id]);

    const loadStore = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/stores/${id}/`);
            form.setFieldsValue({
                ...response.data,
                cnpj: formatCNPJ(response.data.cnpj),
            });
        } catch (error) {
            console.error("Erro ao carregar loja:", error);
            toast.error(t("stores:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const storeData = {
                ...values,
                cnpj: values.cnpj.replace(/\D/g, ""),
                name: String(values.name || "").toUpperCase(),
                number: String(values.number || "").toUpperCase(),
                city: String(values.city || "").toUpperCase(),
                state: String(values.state || "").toUpperCase(),
            };

            if (id) {
                await api.patch(`/api/stores/${id}/`, storeData);
                toast.success(t("stores:messages.success.update"));
            } else {
                await api.post("/api/stores/", storeData);
                toast.success(t("stores:messages.success.create"));
            }

            navigate("/stores");
        } catch (error) {
            console.error("Erro ao salvar:", error);

            if (error.response?.data) {
                // Se o erro vier do backend com detalhes
                const errorData = error.response.data;
                if (typeof errorData === "object") {
                    // Se for um objeto com campos específicos
                    Object.keys(errorData).forEach((key) => {
                        const errorMessage = Array.isArray(errorData[key])
                            ? errorData[key].join(", ")
                            : errorData[key];
                        toast.error(`${key}: ${errorMessage}`);
                    });
                } else {
                    // Se for uma mensagem simples
                    toast.error(errorData);
                }
            } else {
                // Se for um erro genérico
                toast.error(t("stores:messages.error.save"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCNPJChange = (e) => {
        const { value } = e.target;
        form.setFieldsValue({
            cnpj: formatCNPJ(value),
        });
    };

    return (
        <Card title={t("stores:form.title.new")} className="form-title">
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
                        placeholder={t("stores:form.fields.name.placeholder")}
                        onChange={(e) =>
                            form.setFieldsValue({
                                name: e.target.value.toUpperCase(),
                            })
                        }
                    />
                </Form.Item>

                <Form.Item
                    name="number"
                    label={t("stores:form.fields.number.label")}
                    rules={[
                        {
                            required: true,
                            message: t("stores:form.fields.number.required"),
                        },
                    ]}
                    className="form-input"
                >
                    <Input
                        placeholder={t("stores:form.fields.number.placeholder")}
                        onChange={(e) =>
                            form.setFieldsValue({
                                number: e.target.value.toUpperCase(),
                            })
                        }
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
                        placeholder={t("stores:form.fields.cnpj.placeholder")}
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
                        placeholder={t("stores:form.fields.city.placeholder")}
                        onChange={(e) =>
                            form.setFieldsValue({
                                city: e.target.value.toUpperCase(),
                            })
                        }
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
                        placeholder={t("stores:form.fields.state.placeholder")}
                        onChange={(e) =>
                            form.setFieldsValue({
                                state: e.target.value.toUpperCase(),
                            })
                        }
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
                                : t("common:buttons.create")}
                        </Button>
                        <Button
                            onClick={() => navigate("/stores")}
                            className="form-button clear-button"
                        >
                            {t("stores:buttons.cancel")}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default StoreForm;
