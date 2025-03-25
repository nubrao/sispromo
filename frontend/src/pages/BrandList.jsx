import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Table, Button, Card, Space, Input, Modal, Form, Row, Col } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ClearOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import brandRepository from "../repositories/brandRepository";
import "../styles/brand.css";

const BrandList = () => {
    const { t } = useTranslation(["brands", "common"]);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterName, setFilterName] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            setLoading(true);
            const data = await brandRepository.getAllBrands();
            // Transforma os dados para ter uma linha por marca/loja
            const formattedData = data.map((item) => ({
                id: `${item.brand_id}-${item.store_id}`,
                brand_id: item.brand_id,
                brand_name: item.brand_name,
                store_id: item.store_id,
                store_name: item.store_name,
                visit_frequency: item.visit_frequency,
            }));
            setBrands(formattedData);
        } catch (error) {
            console.error("Erro ao carregar marcas:", error);
            toast.error(t("brands:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (brandId) => {
        navigate(`/brands/${brandId}/edit`);
    };

    const handleDelete = async (brandId) => {
        try {
            await brandRepository.deleteBrand(brandId);
            toast.success(t("brands:messages.success.delete"));
            loadBrands();
        } catch (error) {
            console.error("Erro ao deletar marca:", error);
            toast.error(t("brands:messages.error.delete"));
        }
    };

    const showDeleteModal = (brand) => {
        setSelectedBrand(brand);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedBrand) {
            handleDelete(selectedBrand.brand_id);
            setDeleteModalVisible(false);
            setSelectedBrand(null);
        }
    };

    const handleClearFilters = () => {
        form.resetFields();
        setFilterName("");
        setFilterStore("");
    };

    const filteredBrands = brands.filter((brand) => {
        const nameMatch = String(brand?.brand_name || "")
            .toLowerCase()
            .includes(String(filterName || "").toLowerCase());

        const storeMatch = String(brand?.store_name || "")
            .toLowerCase()
            .includes(String(filterStore || "").toLowerCase());

        return nameMatch && storeMatch;
    });

    const columns = [
        {
            title: t("brands:list.columns.name"),
            dataIndex: "brand_name",
            key: "brand_name",
            width: 300,
            render: (text) => String(text || "").toUpperCase(),
        },
        {
            title: t("brands:list.columns.store"),
            dataIndex: "store_name",
            key: "store_name",
            width: 300,
            render: (text) => String(text || "").toUpperCase(),
        },
        {
            title: t("brands:list.columns.visit_frequency"),
            dataIndex: "visit_frequency",
            key: "visit_frequency",
            width: 300,
            render: (frequency) =>
                t("brands:list.visit_frequency", { frequency }),
        },
        {
            title: t("brands:list.columns.actions"),
            key: "actions",
            width: 300,
            className: "ant-table-cell-actions",
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record.brand_id)}
                        className="form-button edit-button"
                    >
                        {t("brands:buttons.edit")}
                    </Button>
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => showDeleteModal(record)}
                        className="form-button delete-button"
                    >
                        {t("brands:buttons.delete")}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card title={t("brands:list.title")} className="form-title">
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/brands/new")}
                        className="form-button"
                    >
                        {t("brands:buttons.add")}
                    </Button>
                </Space>
                <Form form={form} layout="vertical" className="form">
                    <Row gutter={16} className="search-row">
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="brand_name"
                                label={t("brands:list.search.brand_name")}
                                className="form-input"
                            >
                                <Input
                                    placeholder={t(
                                        "brands:list.search.brand_placeholder"
                                    )}
                                    allowClear
                                    onChange={(e) =>
                                        setFilterName(e.target.value)
                                    }
                                    className="search-input"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="store_name"
                                label={t("brands:list.search.store_name")}
                                className="form-input"
                            >
                                <Input
                                    placeholder={t(
                                        "brands:list.search.store_placeholder"
                                    )}
                                    allowClear
                                    onChange={(e) =>
                                        setFilterStore(e.target.value)
                                    }
                                    className="search-input"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Button
                        type="default"
                        icon={<ClearOutlined />}
                        onClick={handleClearFilters}
                        className="form-button clear-button"
                    >
                        {t("common:buttons.clear_filters")}
                    </Button>

                    <Table
                        columns={columns}
                        dataSource={filteredBrands}
                        rowKey={(record) => `${record.brand_id}-${record.store_id}`}
                        loading={loading}
                        bordered
                        tableLayout="fixed"
                        className="brand-table"
                    />
                </Form>
            </Card>

            <Modal
                title={t("brands:delete.title")}
                open={deleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setSelectedBrand(null);
                }}
            >
                <p>{t("brands:delete.confirm")}</p>
            </Modal>
        </>
    );
};

export default BrandList;
