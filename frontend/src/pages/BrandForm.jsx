import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Space, Select, InputNumber } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import brandRepository from "../repositories/brandRepository";
import storeRepository from "../repositories/storeRepository";
import "../styles/brand.css";

const BrandForm = () => {
    const { t } = useTranslation(["brands", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);

    useEffect(() => {
        loadStores();
        if (id) {
            loadBrand();
        }
    }, [id]);

    const loadStores = async () => {
        try {
            const data = await storeRepository.getAllStores();
            console.log("Lojas carregadas:", data); // Para debug
            setStores(data);
        } catch (error) {
            console.error("Erro ao carregar lojas:", error);
            toast.error(t("brands:messages.error.load_stores"));
        }
    };

    const loadBrand = async () => {
        try {
            setLoading(true);
            const brandData = await brandRepository.getBrandById(id);
            console.log("Dados recebidos:", brandData);
            if (brandData) {
                // Se há lojas associadas, pega a primeira para edição
                const storeData = brandData.stores?.[0];
                form.setFieldsValue({
                    brand_name: brandData.brand_name,
                    store_id: storeData?.store_id,
                    visit_frequency: storeData?.visit_frequency,
                });
            }
        } catch (error) {
            console.error("Erro ao carregar marca:", error);
            toast.error(t("brands:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const brandData = {
                brand_name: String(values.brand_name || "").toUpperCase(),
                stores: [
                    {
                        store_id: values.store_id,
                        visit_frequency: values.visit_frequency,
                    },
                ],
            };

            if (id) {
                await brandRepository.updateBrand(id, brandData);
                toast.success(t("brands:messages.success.update"));
            } else {
                await brandRepository.createBrand(brandData);
                toast.success(t("brands:messages.success.create"));
            }

            navigate("/brands");
        } catch (error) {
            console.error("Erro ao salvar:", error);

            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === "object") {
                    Object.keys(errorData).forEach((key) => {
                        const errorMessage = Array.isArray(errorData[key])
                            ? errorData[key].join(", ")
                            : errorData[key];
                        toast.error(`${key}: ${errorMessage}`);
                    });
                } else {
                    toast.error(errorData);
                }
            } else {
                toast.error(t("brands:messages.error.save"));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title={
                id ? t("brands:form.title.edit") : t("brands:form.title.new")
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
                    name="brand_name"
                    label={t("brands:form.fields.brand_name.label")}
                    rules={[
                        {
                            required: true,
                            message: t(
                                "brands:form.fields.brand_name.required"
                            ),
                        },
                    ]}
                    className="form-input"
                >
                    <Input
                        placeholder={t(
                            "brands:form.fields.brand_name.placeholder"
                        )}
                        onChange={(e) =>
                            form.setFieldsValue({
                                brand_name: e.target.value.toUpperCase(),
                            })
                        }
                    />
                </Form.Item>

                <Form.Item
                    name="store_id"
                    label={t("brands:form.fields.store.label")}
                    rules={[
                        {
                            required: true,
                            message: t("brands:form.fields.store.required"),
                        },
                    ]}
                    className="form-input"
                >
                    <Select
                        placeholder={t("brands:form.fields.store.placeholder")}
                        allowClear
                    >
                        {stores.map((store) => (
                            <Select.Option key={store.id} value={store.id}>
                                {store.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="visit_frequency"
                    label={t("brands:form.fields.visit_frequency.label")}
                    rules={[
                        {
                            required: true,
                            message: t(
                                "brands:form.fields.visit_frequency.required"
                            ),
                        },
                    ]}
                    className="form-input"
                >
                    <InputNumber
                        min={1}
                        placeholder={t(
                            "brands:form.fields.visit_frequency.placeholder"
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
                            {loading
                                ? t("brands:form.buttons.processing")
                                : id
                                ? t("brands:form.buttons.save")
                                : t("brands:form.buttons.save")}
                        </Button>
                        <Button
                            onClick={() => navigate("/brands")}
                            className="form-button clear-button"
                        >
                            {t("brands:buttons.cancel")}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default BrandForm;
