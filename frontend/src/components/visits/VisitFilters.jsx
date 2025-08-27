import { Form, Row, Col, Input, Select, Button } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useCache } from "../../hooks/useCache";
import { Toast } from "../Toast";

const VisitFilters = ({
    filterPromoter,
    setFilterPromoter,
    filterStore,
    setFilterStore,
    filterBrand,
    setFilterBrand,
    filterDate,
    setFilterDate,
    clearFilters,
    isPromoter,
}) => {
    const { t } = useTranslation(["visits", "common"]);
    const [form] = Form.useForm();

    // Carregando dados para os filtros
    const { data: promotersData, loading: loadingPromoters } = useCache(
        "/api/users/",
        { role: 1 },
        {
            ttl: 5 * 60 * 1000,
            onError: () =>
                Toast.error(t("visits:messages.error.load_promoters")),
        }
    );

    const { data: storesData, loading: loadingStores } = useCache(
        "/api/stores/",
        {},
        {
            ttl: 5 * 60 * 1000,
            onError: () => Toast.error(t("visits:messages.error.load_stores")),
        }
    );

    const { data: brandsData, loading: loadingBrands } = useCache(
        "/api/brands/",
        {},
        {
            ttl: 30 * 60 * 1000,
            onError: () => Toast.error(t("visits:messages.error.load_brands")),
        }
    );

    const handleSearch = () => {
        const values = form.getFieldsValue();
        setFilterPromoter(values.promoter || "");
        setFilterStore(values.store || "");
        setFilterBrand(values.brand || "");
        setFilterDate(values.date || "");
    };

    return (
        <Form form={form} layout="vertical" className="form">
            <Row gutter={16} className="search-row">
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="promoter"
                        label={t("visits:filters.promoter.label")}
                        className="form-input"
                    >
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder={t(
                                "visits:filters.promoter.placeholder"
                            )}
                            allowClear
                            onChange={(e) => {
                                form.setFieldValue("promoter", e.target.value);
                                handleSearch();
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="store"
                        label={t("visits:filters.store.label")}
                        className="form-input"
                    >
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder={t(
                                "visits:filters.store.placeholder"
                            )}
                            allowClear
                            onChange={(e) => {
                                form.setFieldValue("store", e.target.value);
                                handleSearch();
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="brand"
                        label={t("visits:filters.brand.label")}
                        className="form-input"
                    >
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder={t(
                                "visits:filters.brand.placeholder"
                            )}
                            allowClear
                            onChange={(e) => {
                                form.setFieldValue("brand", e.target.value);
                                handleSearch();
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                    <Form.Item
                        name="date"
                        label={t("visits:filters.date.label")}
                        className="form-input"
                    >
                        <Input
                            type="date"
                            onChange={(e) => {
                                form.setFieldValue("date", e.target.value);
                                handleSearch();
                            }}
                        />
                    </Form.Item>
                </Col>
            </Row>
            <Button
                type="default"
                icon={<ClearOutlined />}
                onClick={() => {
                    form.resetFields();
                    clearFilters();
                }}
                className="form-button clear-button"
            >
                {t("common:buttons.clear_filters")}
            </Button>
        </Form>
    );
};

export default VisitFilters;
