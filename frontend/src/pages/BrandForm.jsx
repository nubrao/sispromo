import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Space, Select, InputNumber } from "antd";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import brandRepository from "../repositories/brandRepository";
import storeRepository from "../repositories/storeRepository";
import "../styles/brand.css";

const BrandForm = () => {
    const { t } = useTranslation(["brands", "common"]);
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const selectedStoreId = location.state?.storeId;

    useEffect(() => {
        loadStores();
        if (id && selectedStoreId) {
            loadBrand();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, selectedStoreId]);

    const loadStores = async () => {
        try {
            const data = await storeRepository.getAllStores();
            setStores(data);
        } catch (error) {
            console.error("Erro ao carregar lojas:", error);
            toast.error(t("brands:messages.error.load_stores"));
        }
    };

    const loadBrand = async () => {
        try {
            setLoading(true);
            const data = await brandRepository.getBrandById(id);

            // Se os dados vierem como array (GET /brands/)
            if (Array.isArray(data)) {
                const brandStore = data.find(
                    (item) =>
                        parseInt(item.store_id) === parseInt(selectedStoreId)
                );

                if (brandStore) {
                    form.setFieldsValue({
                        brand_name: brandStore.brand_name,
                        store_id: parseInt(brandStore.store_id),
                        visit_frequency: parseInt(brandStore.visit_frequency),
                    });
                }
            }
            // Se os dados vierem como objeto com array stores (GET /brands/{id})
            else if (data && data.stores) {
                const storeData = data.stores.find(
                    (store) =>
                        parseInt(store.store_id) === parseInt(selectedStoreId)
                );

                if (storeData) {
                    form.setFieldsValue({
                        brand_name: data.brand_name,
                        store_id: parseInt(storeData.store_id),
                        visit_frequency: parseInt(storeData.visit_frequency),
                    });
                }
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
                store_id: parseInt(values.store_id),
                visit_frequency: parseInt(values.visit_frequency),
            };

            if (id) {
                await brandRepository.updateBrand(parseInt(id), brandData);
                toast.success(t("brands:messages.success.update"));
            } else {
                await brandRepository.createBrand(brandData);
                toast.success(t("brands:messages.success.create"));
            }

            navigate("/brands");
        } catch (error) {
            console.error("Erro ao salvar:", error);

            if (error.response?.data?.error) {
                const errorData = error.response.data.error;
                Object.keys(errorData).forEach((key) => {
                    const errorMessage = Array.isArray(errorData[key])
                        ? errorData[key].join(", ")
                        : errorData[key];
                    toast.error(`${key}: ${errorMessage}`);
                });
            } else if (error.response?.data) {
                toast.error(error.response.data);
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
                            <Select.Option
                                key={store.id}
                                value={parseInt(store.id)}
                            >
                                {String(store.name || "").toUpperCase()}
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
                        type="number"
                        className="input-number"
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
