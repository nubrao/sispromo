import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Form, Button, Select, DatePicker, Space } from "antd";
import "../../styles/form.css";
import { Navigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCache } from "../../hooks/useCache";
import { Toast } from "../Toast";
import Loader from "../Loader";
import api from "../../services/api";

const { Option } = Select;

const VISIT_STATUS = {
    PENDING: "pending",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

const VisitForm = ({
    promoterId,
    setPromoterId,
    storeId,
    setStoreId,
    brand,
    setBrand,
    visitDate,
    setVisitDate,
    promoters,
    brands,
    handleSubmit,
    isPromoter,
    filteredStores,
    isEditing,
    loading,
}) => {
    const { t } = useTranslation(["visits", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();

    // Usando o hook useCache para carregar os dados
    const {
        data: promotersData,
        loading: loadingPromoters,
        error: promotersError,
    } = useCache(
        "/api/promoters/",
        {},
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

    useEffect(() => {
        if (id) {
            loadVisit();
        }
    }, [id]);

    const loadVisit = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/visits/${id}/`);
            form.setFieldsValue({
                ...response.data,
                date: response.data.visit_date,
            });
        } catch (error) {
            Toast.error(t("visits:messages.error.load"));
            navigate("/visits");
        } finally {
            setLoading(false);
        }
    };

    const handleBrandChange = (value) => {
        const selectedBrand = brands.find((b) => b.brand_id === value);
        setBrand({
            id: selectedBrand?.brand_id || "",
            name: selectedBrand?.brand_name || "",
        });
    };

    const handleSubmitForm = async (values) => {
        try {
            setLoading(true);
            const data = {
                ...values,
                visit_date: values.date.format("YYYY-MM-DD"),
            };

            if (id) {
                await api.put(`/api/visits/${id}/`, data);
                Toast.success(t("visits:messages.success.update"));
            } else {
                await api.post("/api/visits/", data);
                Toast.success(t("visits:messages.success.create"));
            }
            navigate("/visits");
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
                Toast.error(t("visits:messages.error.validation"));
            } else {
                Toast.error(t("visits:messages.error.save"));
            }
        } finally {
            setLoading(false);
        }
    };

    // Se houver erro em alguma das requisições principais
    if (promotersError || storesError || brandsError) {
        return <div>Erro ao carregar dados. Por favor, tente novamente.</div>;
    }

    // Se estiver carregando os dados principais
    if (loadingPromoters || loadingStores || loadingBrands) {
        return <Loader />;
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            initialValues={{
                promoter_id: promoterId,
                brand_id: brand.id,
                store_id: storeId,
                visit_date: visitDate ? visitDate : undefined,
            }}
        >
            {!isPromoter && (
                <Form.Item
                    name="promoter_id"
                    label={t("visits:form.fields.promoter.label")}
                    rules={[
                        {
                            required: true,
                            message: t("visits:form.fields.promoter.required"),
                        },
                    ]}
                >
                    <Select
                        placeholder={t(
                            "visits:form.fields.promoter.placeholder"
                        )}
                        onChange={(value) => setPromoterId(value)}
                        options={allPromoters.map((promoter) => ({
                            value: promoter.id,
                            label: promoter.name,
                        }))}
                    />
                </Form.Item>
            )}

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
                    onChange={handleBrandChange}
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
                    onChange={(value) => setStoreId(value)}
                    disabled={!brand.id}
                    options={allStores.map((store) => ({
                        value: store.id,
                        label: `${store.name} - ${store.number}`,
                    }))}
                />
            </Form.Item>

            <Form.Item
                name="visit_date"
                label={t("visits:form.fields.date.label")}
                rules={[
                    {
                        required: true,
                        message: t("visits:form.fields.date.required"),
                    },
                ]}
            >
                <DatePicker
                    placeholder={t("visits:form.fields.date.placeholder")}
                    onChange={(date) => setVisitDate(date)}
                    format="YYYY-MM-DD"
                />
            </Form.Item>

            <Form.Item
                name="status"
                label={t("visits:form.fields.status.label")}
                rules={[
                    {
                        required: true,
                        message: t("visits:form.fields.status.required"),
                    },
                ]}
            >
                <Select
                    placeholder={t("visits:form.fields.status.placeholder")}
                >
                    {Object.entries(VISIT_STATUS).map(([key, value]) => (
                        <Option key={value} value={value}>
                            {t(`visits:status.${value}`)}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {loading
                            ? t("visits:form.buttons.processing")
                            : isEditing
                            ? t("visits:form.buttons.update")
                            : t("visits:form.buttons.save")}
                    </Button>
                    <Button onClick={() => Navigate("/visits")}>
                        {t("visits:form.buttons.cancel")}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

VisitForm.propTypes = {
    promoterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    setPromoterId: PropTypes.func.isRequired,
    storeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    setStoreId: PropTypes.func.isRequired,
    brand: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
    }).isRequired,
    setBrand: PropTypes.func.isRequired,
    visitDate: PropTypes.string.isRequired,
    setVisitDate: PropTypes.func.isRequired,
    promoters: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    stores: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            number: PropTypes.string.isRequired,
        })
    ).isRequired,
    brands: PropTypes.arrayOf(
        PropTypes.shape({
            brand_id: PropTypes.number.isRequired,
            brand_name: PropTypes.string.isRequired,
        })
    ).isRequired,
    handleSubmit: PropTypes.func.isRequired,
    isPromoter: PropTypes.bool.isRequired,
    filteredStores: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            number: PropTypes.string.isRequired,
        })
    ).isRequired,
    isEditing: PropTypes.bool,
    loading: PropTypes.bool,
};

VisitForm.defaultProps = {
    isEditing: false,
    loading: false,
};

export default VisitForm;
