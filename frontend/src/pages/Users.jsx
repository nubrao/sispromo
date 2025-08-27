import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Table, Button, Space, Popconfirm, Input, Tag } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { useCancelableAxios } from "../hooks/useCancelableAxios";

const { Search } = Input;

const Users = () => {
    const { data: users = [], loading, error } = useCancelableAxios({ method: 'get', url: '/api/users/' });
    const { t } = useTranslation(["users", "common"]);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await api.delete(`/api/users/${id}/`);
            toast.success(t("users:messages.success.delete"));
            loadUsers();
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            toast.error(t("users:messages.error.delete"));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => setSearchTerm(value);

    const filteredUsers = users.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    });

    const getRoleColor = (role) => {
        switch (role) {
            case 3: // Gestor
                return "blue";
            case 2: // Analista
                return "green";
            case 1: // Promotor
                return "orange";
            default:
                return "default";
        }
    };

    const columns = [
        {
            title: t("users:list.columns.name"),
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: t("users:list.columns.email"),
            dataIndex: "email",
            key: "email",
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: t("users:list.columns.role"),
            dataIndex: "role",
            key: "role",
            render: (role) => (
                <Tag color={getRoleColor(role)}>{t(`users:roles.${role}`)}</Tag>
            ),
            sorter: (a, b) => a.role - b.role,
        },
        {
            title: t("common:table.actions.title"),
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => navigate(`/users/edit/${record.id}`)}
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
            title={t("users:title")}
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/users/new")}
                >
                    {t("users:buttons.new")}
                </Button>
            }
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <Search
                    placeholder={t("users:search.placeholder")}
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ maxWidth: 300 }}
                    prefix={<SearchOutlined />}
                />

                <Table
                    dataSource={filteredUsers}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        total: filteredUsers.length,
                        pageSize: 10,
                        showTotal: (total) =>
                            t("common:table.pagination.total", { total }),
                    }}
                />
            </Space>
        </Card>
    );
};

export default Users;
