import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Form, Button, Select, DatePicker, Space } from "antd";
import "../../styles/form.css";
import { Navigate } from "react-router-dom";

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

    const handleBrandChange = (value) => {
        const selectedBrand = brands.find((b) => b.brand_id === value);
        setBrand({
            id: selectedBrand?.brand_id || "",
            name: selectedBrand?.brand_name || "",
        });
    };

    return (
        <Form
            onFinish={handleSubmit}
            layout="vertical"
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
                        options={promoters.map((promoter) => ({
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
                    onChange={(value) => setStoreId(value)}
                    disabled={!brand.id}
                    options={filteredStores.map((store) => ({
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
