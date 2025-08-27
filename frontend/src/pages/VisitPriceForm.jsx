import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Select, Card, Space } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import PropTypes from "prop-types";
import "../styles/form.css";
import { useCache } from "../hooks/useCache";
import { Toast } from "../components/Toast";
import Loader from "../components/Loader";

const { Option } = Select;

const VisitPriceForm = ({ loading, setLoading }) => {
    const { t } = useTranslation(["visits", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();

    // Usando o hook useCache para carregar os dados
    const {
        data: brands,
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

    const {
        data: stores,
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

    // Processando os dados usando useMemo para evitar recálculos desnecessários
    const allBrands = useMemo(() => brands || [], [brands]);
    const allStores = useMemo(() => stores || [], [stores]);

    useEffect(() => {
        if (id) {
            loadVisitPrice();
        }
    }, [id]);

    const loadVisitPrice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/visit-prices/${id}/`);
            form.setFieldsValue(response.data);
        } catch (error) {
            Toast.error(t("visits:messages.error.load_price"));
            navigate("/visit-prices");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            if (id) {
                await api.put(`/api/visit-prices/${id}/`, values);
                toast.success(t("visits:messages.success.update_price"));
            } else {
                await api.post("/api/visit-prices/", values);
                toast.success(t("visits:messages.success.create_price"));
            }
            navigate("/visit-prices");
        } catch (error) {
            if (error.response?.status === 400) {
                const errors = error.response.data;
                Object.keys(errors).forEach((key) => {
                    form.setFields([
                        {
                            name: key,
                            errors: [errors[key]],
                        },
                    ]);
                });
                toast.error(t("visits:messages.error.validation"));
            } else {
                toast.error(t("visits:messages.error.save_price"));
            }
        } finally {
            setLoading(false);
        }
    };

    const validatePrice = async (_, value) => {
        if (!value) {
            return Promise.reject(t("visits:validation.price_required"));
        }

        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
            return Promise.reject(t("visits:validation.price_invalid"));
        }

        // Verifica se já existe um preço para a mesma combinação de loja e marca
        const values = form.getFieldsValue();
        if (!id) {
            try {
                const response = await api.get("/api/visit-prices/", {
                    params: {
                        store: values.store_id,
                        brand: values.brand_id,
                    },
                });
                if (response.data.length > 0) {
                    return Promise.reject(t("visits:validation.price_exists"));
                }
            } catch (error) {
                console.error("Erro ao verificar preço existente:", error);
            }
        }

        return Promise.resolve();
    };

    // Se houver erro em alguma das requisições principais
    if (brandsError || storesError) {
        return <div>Erro ao carregar dados. Por favor, tente novamente.</div>;
    }

    // Se estiver carregando os dados principais
    if (loadingBrands || loadingStores) {
        return <Loader />;
    }

    return (
        <Card
            title={
                id
                    ? t("visits:price.edit_title")
                    : t("visits:price.create_title")
            }
        >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Form.Item
                    name="brand_id"
                    label={t("visits:form.fields.brand.label")}
                    rules={[
                        {
                            required: true,
                            message: t("visits:form.fields.brand.required"),
                        },
                    ]}
                >
                    <Select
                        placeholder={t("visits:form.fields.brand.placeholder")}
                        onChange={(value) => {
                            form.setFieldValue("brand_id", value);
                        }}
                        options={allBrands.map((brand) => ({
                            value: brand.brand_id,
                            label: brand.brand_name,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="store_id"
                    label={t("visits:form.fields.store.label")}
                    rules={[
                        {
                            required: true,
                            message: t("visits:form.fields.store.required"),
                        },
                    ]}
                >
                    <Select
                        placeholder={t("visits:form.fields.store.placeholder")}
                        disabled={!form.getFieldValue("brand_id")}
                        options={allStores.map((store) => ({
                            value: store.id,
                            label: `${store.name} - ${store.number}`,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="price"
                    label={t("visits:price.fields.price.label")}
                    rules={[
                        {
                            required: true,
                            message: t("visits:price.fields.price.required"),
                        },
                        {
                            type: "number",
                            min: 0,
                            message: t("visits:price.fields.price.min"),
                        },
                        {
                            validator: validatePrice,
                        },
                    ]}
                >
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t("visits:price.fields.price.placeholder")}
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
                                : id
                                ? t("visits:form.buttons.update")
                                : t("visits:form.buttons.save")}
                        </Button>
                        <Button onClick={() => navigate("/visit-prices")}>
                            {t("visits:form.buttons.cancel")}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

VisitPriceForm.propTypes = {
    loading: PropTypes.bool.isRequired,
    setLoading: PropTypes.func.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    success: PropTypes.bool.isRequired,
    setSuccess: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    setErrorMessage: PropTypes.func.isRequired,
};

export default VisitPriceForm;
