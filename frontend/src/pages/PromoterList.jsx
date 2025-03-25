import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Table,
    Input,
    Space,
    Button,
    Card,
    Form,
    Row,
    Col,
    Tag,
    Select,
} from "antd";
import {
    EditOutlined,
    SearchOutlined,
    ClearOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { formatPhone } from "../utils/formatters";
import { useNavigate } from "react-router-dom";
import "../styles/promoter.css";
import { useCache } from "../hooks/useCache";
import { Toast } from "../components/Toast";
import Loader from "../components/Loader";

const PromoterList = () => {
    const { t } = useTranslation(["promoters", "common"]);
    const navigate = useNavigate();
    const [filteredPromoters, setFilteredPromoters] = useState([]);
    const [searchForm] = Form.useForm();

    // Usando o hook useCache para carregar os dados
    const {
        data: users,
        loading: loadingUsers,
        error: usersError,
    } = useCache(
        "/api/users/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            onError: () => Toast.error(t("promoters:messages.error.load")),
        }
    );

    const {
        data: promoterBrandsData,
        loading: loadingBrands,
        error: brandsError,
    } = useCache(
        "/api/promoter-brands/",
        {},
        {
            ttl: 5 * 60 * 1000, // 5 minutos
            timeout: 60000, // 60 segundos
            onError: () =>
                Toast.error(t("promoters:messages.error.load_brands")),
        }
    );

    const { data: brandsData, loading: loadingAvailableBrands } = useCache(
        "/api/brands/",
        {},
        {
            ttl: 30 * 60 * 1000, // 30 minutos
        }
    );

    // Processando os dados usando useMemo para evitar recálculos desnecessários
    const allPromoters = useMemo(
        () => users?.filter((user) => user.role === 1) || [],
        [users]
    );

    const promoterBrands = useMemo(
        () =>
            promoterBrandsData?.reduce((acc, brand) => {
                if (!acc[brand.promoter.id]) {
                    acc[brand.promoter.id] = [];
                }
                acc[brand.promoter.id].push(brand);
                return acc;
            }, {}) || {},
        [promoterBrandsData]
    );

    const availableBrands = useMemo(
        () =>
            brandsData
                ? Array.from(
                      new Set(brandsData.map((brand) => brand.brand_id))
                  ).map((brandId) => ({
                      id: brandId,
                      brand_name: brandsData.find((b) => b.brand_id === brandId)
                          .brand_name,
                  }))
                : [],
        [brandsData]
    );

    // Inicializa os promotores filtrados apenas uma vez quando os dados são carregados
    useEffect(() => {
        if (allPromoters.length > 0 && filteredPromoters.length === 0) {
            setFilteredPromoters(allPromoters);
        }
    }, [allPromoters]);

    const handleEdit = (record) => {
        navigate(`/promoters/${record.id}/edit`);
    };

    const handleSearch = () => {
        const values = searchForm.getFieldsValue();
        const filteredData = allPromoters.filter((item) => {
            const fullName =
                `${item.first_name} ${item.last_name}`.toLowerCase();
            const searchName = values.name?.toLowerCase().trim() || "";
            const searchPhone = values.phone?.trim() || "";

            const nameMatch =
                searchName === "" || fullName.includes(searchName);
            const phoneMatch =
                searchPhone === "" ||
                formatPhone(item.phone).includes(searchPhone);

            const brandMatch =
                !values.brand?.length ||
                promoterBrands[item.id]?.some((pb) =>
                    values.brand.includes(pb.brand.brand_id)
                );

            return nameMatch && phoneMatch && brandMatch;
        });

        setFilteredPromoters(filteredData);
    };

    const clearFilters = () => {
        searchForm.resetFields();
        setFilteredPromoters(allPromoters);
    };

    const columns = [
        {
            title: t("promoters:table.name"),
            dataIndex: "first_name",
            width: 150,
            render: (_, record) => `${record.first_name} ${record.last_name}`,
        },
        {
            title: t("promoters:table.email"),
            dataIndex: "email",
            key: "email",
            width: 180,
        },
        {
            title: t("promoters:table.phone"),
            dataIndex: "phone",
            key: "phone",
            width: 150,
            render: (phone) => formatPhone(phone),
        },
        {
            title: t("promoters:table.brands"),
            dataIndex: "brands",
            key: "brands",
            width: 250,
            render: (_, record) => (
                <Space size={[0, 8]} wrap>
                    {promoterBrands[record.id]?.map((pb) => (
                        <Tag
                            key={`${record.id}-${pb.brand.brand_id}`}
                            color="blue"
                        >
                            {pb.brand.brand_name.toUpperCase()}
                        </Tag>
                    )) || []}
                </Space>
            ),
        },
        {
            title: t("promoters:table.actions"),
            key: "actions",
            width: 120,
            className: "ant-table-cell-actions",
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="form-button edit-button"
                    >
                        {t("promoters:buttons.edit")}
                    </Button>
                </Space>
            ),
        },
    ];

    // Se houver erro em alguma das requisições principais
    if (usersError || brandsError) {
        return <div>Erro ao carregar dados. Por favor, tente novamente.</div>;
    }

    // Se estiver carregando os dados principais
    if (loadingUsers || loadingBrands) {
        return <Loader />;
    }

    return (
        <>
            <Card title={t("promoters:title")} className="form-title">
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/promoters/new")}
                        className="form-button"
                    >
                        {t("promoters:buttons.new")}
                    </Button>
                </Space>
                <Form form={searchForm} layout="vertical" className="form">
                    <Row gutter={16} className="search-row ">
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="name"
                                label={t("promoters:search.name")}
                                className="form-input"
                            >
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder={t("promoters:search.name")}
                                    allowClear
                                    onChange={(e) => {
                                        searchForm.setFieldValue(
                                            "name",
                                            e.target.value
                                        );
                                        handleSearch();
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="phone"
                                label={t("promoters:search.phone")}
                                className="form-input"
                            >
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder={t("promoters:search.phone")}
                                    allowClear
                                    onChange={(e) => {
                                        searchForm.setFieldValue(
                                            "phone",
                                            e.target.value
                                        );
                                        handleSearch();
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="brand"
                                label={t("promoters:filters.brand")}
                                className="form-input"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder={t(
                                        "promoters:filters.placeholders.brand"
                                    )}
                                    options={availableBrands.map((brand) => ({
                                        value: brand.id,
                                        label: brand.brand_name.toUpperCase(),
                                    }))}
                                    onChange={(value) => {
                                        searchForm.setFieldValue(
                                            "brand",
                                            value
                                        );
                                        handleSearch();
                                    }}
                                    maxTagCount={2}
                                    maxTagTextLength={10}
                                    loading={loadingAvailableBrands}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Button
                        type="default"
                        icon={<ClearOutlined />}
                        onClick={clearFilters}
                        className="form-button clear-button"
                    >
                        {t("common:buttons.clear_filters")}
                    </Button>
                </Form>

                <Table
                    bordered
                    dataSource={filteredPromoters}
                    columns={columns}
                    loading={loadingUsers || loadingBrands}
                    tableLayout="fixed"
                    rowKey="id"
                />
            </Card>
        </>
    );
};

export default PromoterList;
