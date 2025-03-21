import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Table, Button, Space, Popconfirm, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import api from "../services/api";

const { Search } = Input;

const VisitPrices = () => {
    const { t } = useTranslation(["visitPrices", "common"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [prices, setPrices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadPrices();
    }, []);

    const loadPrices = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/visit-prices/");
            setPrices(response.data);
        } catch (error) {
            console.error("Erro ao carregar preços:", error);
            toast.error(t("visitPrices:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await api.delete(`/api/visit-prices/${id}/`);
            toast.success(t("visitPrices:messages.success.delete"));
            loadPrices();
        } catch (error) {
            console.error("Erro ao excluir preço:", error);
            toast.error(t("visitPrices:messages.error.delete"));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const filteredPrices = prices.filter((price) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            price.brand_name.toLowerCase().includes(searchLower) ||
            price.store_name.toLowerCase().includes(searchLower)
        );
    });

    const columns = [
        {
            title: t("visitPrices:list.columns.brand"),
            dataIndex: "brand_name",
            key: "brand_name",
            sorter: (a, b) => a.brand_name.localeCompare(b.brand_name),
        },
        {
            title: t("visitPrices:list.columns.store"),
            dataIndex: "store_name",
            key: "store_name",
            render: (text, record) =>
                `${text} - ${record.store_number || "S/N"}`,
            sorter: (a, b) => a.store_name.localeCompare(b.store_name),
        },
        {
            title: t("visitPrices:list.columns.price"),
            dataIndex: "price",
            key: "price",
            render: (price) => `R$ ${parseFloat(price).toFixed(2)}`,
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: t("common:table.actions.title"),
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() =>
                            navigate(`/visit-prices/edit/${record.id}`)
                        }
                    >
                        {t("common:table.actions.edit")}
                    </Button>
                    <Popconfirm
                        title={t("common:messages.confirm.delete")}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("common:table.actions.confirm")}
                        cancelText={t("common:table.actions.cancel")}
                    >
                        <Button type="primary" danger>
                            {t("common:table.actions.delete")}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title={t("visitPrices:title")}
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/visit-prices/new")}
                >
                    {t("visitPrices:buttons.new")}
                </Button>
            }
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <Search
                    placeholder={t("visitPrices:search.placeholder")}
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ maxWidth: 300 }}
                    prefix={<SearchOutlined />}
                />

                <Table
                    dataSource={filteredPrices}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        total: filteredPrices.length,
                        pageSize: 10,
                        showTotal: (total) =>
                            t("common:table.pagination.total", { total }),
                    }}
                />
            </Space>
        </Card>
    );
};

export default VisitPrices;
