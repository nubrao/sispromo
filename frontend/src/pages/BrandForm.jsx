import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Select, Space } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

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
            const response = await api.get("/api/stores/");
            setStores(response.data);
        } catch (error) {
            console.error("Erro ao carregar lojas:", error);
            toast.error(t("brands:messages.error.load_stores"));
        }
    };

    const loadBrand = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/brands/${id}/`);
            form.setFieldsValue({
                name: response.data.brand_name,
                store_id: response.data.store_id,
                visit_frequency: response.data.visit_frequency,
            });
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
            const data = {
                brand_name: values.name.trim().toUpperCase(),
                store_id: values.store_id,
                visit_frequency: values.visit_frequency,
            };

            if (id) {
                await api.put(`/api/brands/${id}/`, data);
                toast.success(t("brands:messages.success.update"));
            } else {
                await api.post("/api/brands/", data);
                toast.success(t("brands:messages.success.create"));
            }

            navigate("/brands");
        } catch (error) {
            const errorMessage =
                error.response?.data?.brand_name?.[0] ||
                error.response?.data?.store_id?.[0] ||
                t("brands:messages.error.exists");
            toast.error(errorMessage);
        } finally {
        setLoading(false);
        }
    };

    return (
        <Card
            title={
                id ? t("brands:form.edit_title") : t("brands:form.create_title")
            }
        >
            <Form
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                initialValues={{ visit_frequency: 1 }}
            >
                <Form.Item
                    name="name"
                    label={t("brands:form.fields.first_name.label")}
                    rules={[
                        {
                            required: true,
                            message: t("brands:form.fields.first_name.required"),
                        },
                    ]}
                >
                    <Input
                        placeholder={t("brands:form.fields.first_name.placeholder")}
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
                >
                    <Select
                        placeholder={t("brands:form.fields.store.placeholder")}
                        options={stores.map((store) => ({
                            value: store.id,
                            label: `${store.name.toUpperCase()} - ${
                                store.number
                            }`,
                        }))}
                    />
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
                        {
                            type: "number",
                            min: 1,
                            message: t(
                                "brands:form.fields.visit_frequency.min"
                            ),
                        },
                    ]}
                >
                    <Input
                                                    type="number"
                        min={1}
                        placeholder={t(
                            "brands:form.fields.visit_frequency.placeholder"
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
                                ? t("brands:form.buttons.processing")
                                : t("brands:form.buttons.save")}
                        </Button>
                        <Button onClick={() => navigate("/brands")}>
                            {t("brands:form.buttons.cancel")}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default BrandForm;
