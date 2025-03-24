import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Table,
    Input,
    Space,
    Button,
    Card,
    Form,
    Modal,
    message,
    Row,
    Col,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    ClearOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { formatCNPJ } from "../utils/formatters";
import "../styles/storeForm.css";
import storeRepository from "../repositories/storeRepository";

const StoreList = () => {
    const { t } = useTranslation(["stores", "common"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedStore, setSelectedStore] = useState(null);
    const [searchForm] = Form.useForm();

    const loadStores = async () => {
        try {
            setLoading(true);
            const data = await storeRepository.getAllStores();
            setStores(data);
            setFilteredStores(data);
        } catch (error) {
            message.error(t("stores:messages.error.load"));
            console.error("Erro ao carregar lojas:", error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStores();
    }, []);

    useEffect(() => {
        const values = searchForm.getFieldsValue();
        const filtered = stores.filter((store) => {
            return (
                String(store.name || "")
                    .toUpperCase()
                    .includes(String(values.name || "").toUpperCase()) &&
                String(store.number || "")
                    .toUpperCase()
                    .includes(String(values.number || "").toUpperCase()) &&
                String(store.cnpj || "")
                    .toUpperCase()
                    .includes(String(values.cnpj || "").toUpperCase()) &&
                String(store.city || "")
                    .toUpperCase()
                    .includes(String(values.city || "").toUpperCase()) &&
                String(store.state || "")
                    .toUpperCase()
                    .includes(String(values.state || "").toUpperCase())
            );
        });
        setFilteredStores(filtered);
    }, [searchForm, stores]);

    const handleClearFilters = () => {
        searchForm.resetFields();
        setFilteredStores(stores);
    };

    const handleEdit = (store) => {
        navigate(`/stores/${store.id}/edit`);
    };

    const handleDelete = (store) => {
        setSelectedStore(store);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        try {
            await storeRepository.deleteStore(selectedStore.id);
            message.success(t("stores:messages.success.deleted"));
            loadStores();
        } catch (error) {
            message.error(t("stores:messages.error.delete"));
            console.error("Erro ao excluir loja:", error);
        } finally {
            setDeleteModalVisible(false);
            setSelectedStore(null);
        }
    };

    const columns = [
        {
            title: t("stores:form.fields.name.label"),
            dataIndex: "name",
            key: "name",
            width: 200,
            render: (text) => String(text || "").toUpperCase(),
        },
        {
            title: t("stores:form.fields.number.label"),
            dataIndex: "number",
            key: "number",
            width: 100,
            render: (text) => String(text || "").toUpperCase(),
        },
        {
            title: t("stores:form.fields.cnpj.label"),
            dataIndex: "cnpj",
            key: "cnpj",
            width: 150,
            render: (cnpj) => formatCNPJ(cnpj),
        },
        {
            title: t("stores:form.fields.city.label"),
            dataIndex: "city",
            key: "city",
            width: 150,
            render: (text) => String(text || "").toUpperCase(),
        },
        {
            title: t("stores:form.fields.state.label"),
            dataIndex: "state",
            key: "state",
            width: 100,
            render: (text) => String(text || "").toUpperCase(),
        },
        {
            title: "Ações",
            key: "actions",
            width: 200,
            fixed: "right",
            className: "ant-table-cell-actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="form-button edit-button"
                    >
                        {t("common:buttons.edit")}
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                        className="form-button delete-button"
                    >
                        {t("common:buttons.delete")}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Card title={t("stores:title")} className="form-title">
            <Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/stores/new")}
                    className="form-button"
                >
                    {t("stores:form.title.create")}
                </Button>
            </Space>
            <Form form={searchForm} layout="vertical" className="form">
                <Row gutter={[16, 16]} className="search-row">
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="name"
                            label={t("stores:search.name")}
                            className="form-input"
                        >
                            <Input
                                placeholder={t("stores:search.name")}
                                allowClear
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    searchForm.setFieldValue("name", value);
                                    const values = searchForm.getFieldsValue();
                                    setFilteredStores(
                                        stores.filter((store) =>
                                            String(store.name || "")
                                                .toUpperCase()
                                                .includes(
                                                    String(
                                                        values.name || ""
                                                    ).toUpperCase()
                                                )
                                        )
                                    );
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="number"
                            label={t("stores:search.number")}
                            className="form-input"
                        >
                            <Input
                                placeholder={t(
                                    "stores:form.fields.number.label"
                                )}
                                allowClear
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    searchForm.setFieldValue("number", value);
                                    const values = searchForm.getFieldsValue();
                                    setFilteredStores(
                                        stores.filter((store) =>
                                            String(store.number || "")
                                                .toUpperCase()
                                                .includes(
                                                    String(
                                                        values.number || ""
                                                    ).toUpperCase()
                                                )
                                        )
                                    );
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="cnpj"
                            label={t("stores:search.cnpj")}
                            className="form-input"
                        >
                            <Input
                                placeholder={t("stores:search.cnpj")}
                                allowClear
                                maxLength={18}
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /\D/g,
                                        ""
                                    );
                                    const formattedValue = formatCNPJ(value);
                                    searchForm.setFieldValue(
                                        "cnpj",
                                        formattedValue
                                    );
                                    const values = searchForm.getFieldsValue();
                                    setFilteredStores(
                                        stores.filter((store) =>
                                            String(store.cnpj || "")
                                                .toUpperCase()
                                                .includes(
                                                    String(
                                                        values.cnpj || ""
                                                    ).toUpperCase()
                                                )
                                        )
                                    );
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="city"
                            label={t("stores:form.fields.city.label")}
                            className="form-input"
                        >
                            <Input
                                placeholder={t("stores:form.fields.city.label")}
                                allowClear
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    searchForm.setFieldValue("city", value);
                                    const values = searchForm.getFieldsValue();
                                    setFilteredStores(
                                        stores.filter((store) =>
                                            String(store.city || "")
                                                .toUpperCase()
                                                .includes(
                                                    String(
                                                        values.city || ""
                                                    ).toUpperCase()
                                                )
                                        )
                                    );
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="state"
                            label={t("stores:form.fields.state.label")}
                            className="form-input"
                        >
                            <Input
                                placeholder={t(
                                    "stores:form.fields.state.label"
                                )}
                                allowClear
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    searchForm.setFieldValue("state", value);
                                    const values = searchForm.getFieldsValue();
                                    setFilteredStores(
                                        stores.filter((store) =>
                                            String(store.state || "")
                                                .toUpperCase()
                                                .includes(
                                                    String(
                                                        values.state || ""
                                                    ).toUpperCase()
                                                )
                                        )
                                    );
                                }}
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
                    bordered
                    columns={columns}
                    dataSource={filteredStores}
                    rowKey="id"
                    loading={loading}
                    tableLayout="fixed"
                    rowClassName="editable-row"
                />
            </Form>

            <Modal
                title={t("stores:list.confirmDelete")}
                open={deleteModalVisible}
                onOk={confirmDelete}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setSelectedStore(null);
                }}
            >
                <p>{t("stores:list.confirmDelete")}</p>
            </Modal>
        </Card>
    );
};

export default StoreList;
