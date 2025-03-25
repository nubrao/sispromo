import { useState, useEffect } from "react";
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
import promoterBrandRepository from "../repositories/promoterBrandRepository";
import userRepository from "../repositories/userRepository";
import brandRepository from "../repositories/brandRepository";
import { toast } from "react-toastify";

const PromoterList = () => {
    const { t } = useTranslation(["promoters", "common"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [allPromoters, setAllPromoters] = useState([]);
    const [filteredPromoters, setFilteredPromoters] = useState([]);
    const [promoterBrands, setPromoterBrands] = useState({});
    const [availableBrands, setAvailableBrands] = useState([]);
    const [searchForm] = Form.useForm();

    useEffect(() => {
        loadPromoters();
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            const response = await brandRepository.getAllBrands();
            const uniqueBrands = Array.from(
                new Set(response.map((brand) => brand.brand_id))
            ).map((brandId) => ({
                id: brandId,
                brand_name: response.find((b) => b.brand_id === brandId)
                    .brand_name,
            }));
            setAvailableBrands(uniqueBrands);
        } catch (error) {
            console.error("Erro ao carregar marcas:", error);
        }
    };

    const loadPromoters = async () => {
        try {
            setLoading(true);
            const [usersResponse, brandsResponse] = await Promise.all([
                userRepository.getAllUsers(),
                promoterBrandRepository.getAllPromoterBrands(),
            ]);

            const promotersList = usersResponse.filter(
                (user) => user.role === 1
            );

            const brandsByPromoter = brandsResponse.reduce((acc, brand) => {
                if (!acc[brand.promoter.id]) {
                    acc[brand.promoter.id] = [];
                }
                acc[brand.promoter.id].push(brand);
                return acc;
            }, {});

            setPromoterBrands(brandsByPromoter);
            setAllPromoters(promotersList);
            setFilteredPromoters(promotersList);
        } catch (error) {
            toast.error(t("promoters:messages.error.load"));
            console.error("Erro ao carregar promotores:", error);
        } finally {
            setLoading(false);
        }
    };

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
                    loading={loading}
                    tableLayout="fixed"
                />
            </Card>
        </>
    );
};

export default PromoterList;
