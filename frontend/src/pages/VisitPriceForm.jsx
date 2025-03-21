import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Select, Card, Space } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import PropTypes from "prop-types";
import "../styles/form.css";

const VisitPriceForm = ({
    loading,
    setLoading,
}) => {
    const { t } = useTranslation(["visits", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [filteredStores, setFilteredStores] = useState([]);

    useEffect(() => {
        loadData();
        if (id) {
            loadVisitPrice();
        }
    }, [id]);

    useEffect(() => {
        if (selectedBrand) {
            // Filtra as lojas que estão vinculadas à marca selecionada
            const storesForBrand = brands
                .filter((b) => b.brand_id === parseInt(selectedBrand, 10))
                .map((b) => b.store_id);

            const filtered = stores.filter((store) =>
                storesForBrand.includes(store.id)
            );
            setFilteredStores(filtered);
        } else {
            setFilteredStores([]);
        }
    }, [selectedBrand, brands, stores]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [brandsResponse, storesResponse] = await Promise.all([
                api.get("/api/brands/"),
                api.get("/api/stores/"),
            ]);

            setBrands(brandsResponse.data);
            setStores(storesResponse.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error(t("visits:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const loadVisitPrice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/visit-prices/${id}/`);
            form.setFieldsValue({
                brand_id: response.data.brand_id,
                store_id: response.data.store_id,
                price: response.data.price,
            });
            handleBrandChange(response.data.brand_id);
        } catch (error) {
            console.error("Erro ao carregar preço da visita:", error);
            toast.error(t("visits:messages.error.load_price"));
        } finally {
            setLoading(false);
        }
    };

    const handleBrandChange = (brandId) => {
        const selectedBrand = brands.find((b) => b.brand_id === brandId);
        if (selectedBrand) {
            const brandStores = stores.filter((store) =>
                brands.some(
                    (b) => b.brand_id === brandId && b.store_id === store.id
                )
            );
            setFilteredStores(brandStores);
        } else {
            setFilteredStores([]);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const data = {
                brand_id: values.brand_id,
                store_id: values.store_id,
                price: parseFloat(values.price),
            };

            if (id) {
                await api.put(`/api/visit-prices/${id}/`, data);
                toast.success(t("visits:messages.success.update_price"));
            } else {
                await api.post("/api/visit-prices/", data);
                toast.success(t("visits:messages.success.create_price"));
            }

            navigate("/visit-prices");
        } catch (error) {
            console.error("Erro ao salvar preço da visita:", error);
            toast.error(t("visits:messages.error.save_price"));
        } finally {
            setLoading(false);
        }
    };
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
                        onChange={handleBrandChange}
                        options={brands.map((brand) => ({
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
                        options={filteredStores.map((store) => ({
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
