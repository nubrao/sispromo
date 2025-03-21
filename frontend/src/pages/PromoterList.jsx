import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Table,
    Input,
    Space,
    Button,
    Card,
    Popconfirm,
    Form,
    Typography,
    message,
    Row,
    Col,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    CloseOutlined,
    SearchOutlined,
    ClearOutlined,
    UserAddOutlined,
} from "@ant-design/icons";
import { formatCPF, formatPhone } from "../utils/formatters";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/promoterForm.css";

const PromoterList = () => {
    const { t } = useTranslation(["promoters", "common"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [promoters, setPromoters] = useState([]);
    const [editingKey, setEditingKey] = useState("");
    const [form] = Form.useForm();
    const [searchForm] = Form.useForm();

    useEffect(() => {
        loadPromoters();
    }, []);

    const loadPromoters = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/users/");
            // Filtra apenas usuários com role = 1 (promotores)
            const promotersList = response.data.filter(
                (user) => user.role === 1
            );
            console.log("Promoters data:", promotersList);
            setPromoters(promotersList);
        } catch {
            message.error(t("promoters:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await api.delete(`/api/users/${id}/`);
            message.success(t("promoters:messages.success.delete"));
            loadPromoters();
        } catch (error) {
            message.error(t("promoters:messages.error.delete"));
        } finally {
            setLoading(false);
        }
    };

    const isEditing = (record) => record.id === editingKey;

    const edit = (record) => {
        form.setFieldsValue({
            ...record,
            cpf: formatCPF(record.cpf),
            phone: formatPhone(record.phone),
        });
        setEditingKey(record.id);
    };

    const cancel = () => {
        setEditingKey("");
    };

    const save = async (id) => {
        try {
            const row = await form.validateFields();
            const newData = [...promoters];
            const index = newData.findIndex((item) => id === item.id);
            if (index > -1) {
                setLoading(true);
                const item = newData[index];
                const updatedItem = {
                    ...item,
                    ...row,
                    cpf: row.cpf.replace(/\D/g, ""),
                    phone: row.phone.replace(/\D/g, ""),
                };
                await api.patch(`/api/users/${id}/`, updatedItem);
                message.success(t("promoters:messages.success.update"));
                setEditingKey("");
                loadPromoters();
            }
        } catch (error) {
            message.error(t("promoters:messages.error.update"));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        const values = searchForm.getFieldsValue();
        const filteredData = promoters.filter((item) => {
            const nameMatch = values.name
                ? item.name.toLowerCase().includes(values.name.toLowerCase())
                : true;
            const cpfMatch = values.cpf
                ? formatCPF(item.cpf).includes(values.cpf)
                : true;
            const phoneMatch = values.phone
                ? formatPhone(item.phone).includes(values.phone)
                : true;
            return nameMatch && cpfMatch && phoneMatch;
        });
        setPromoters(filteredData);
    };

    const clearFilters = () => {
        searchForm.resetFields();
        loadPromoters();
    };

    const columns = [
        {
            title: t("promoters:table.name"),
            dataIndex: "name",
            key: "name",
            editable: true,
            render: (_, record) =>
                `${record.first_name} ${record.last_name}`.toUpperCase(),
            sorter: (a, b) => {
                const nameA = `${a.first_name} ${a.last_name}`;
                const nameB = `${b.first_name} ${b.last_name}`;
                return nameA.localeCompare(nameB);
            },
        },
        {
            title: t("promoters:table.email"),
            dataIndex: "email",
            key: "email",
            editable: true,
            render: (text) => text.toLowerCase(),
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: t("promoters:table.cpf"),
            dataIndex: "cpf",
            key: "cpf",
            editable: true,
            render: (text) => formatCPF(text),
            sorter: (a, b) => a.cpf.localeCompare(b.cpf),
        },
        {
            title: t("promoters:table.phone"),
            dataIndex: "phone",
            key: "phone",
            editable: true,
            render: (text) => formatPhone(text),
            sorter: (a, b) => a.phone.localeCompare(b.phone),
        },
        {
            title: t("promoters:table.brands"),
            dataIndex: "brands",
            key: "brands",
            render: (_, record) => (
                <Space size={[0, 4]} wrap>
                    {record.brands?.map((brand) => (
                        <span key={brand.id} className="brand-tag">
                            {brand.name.toUpperCase()}
                        </span>
                    ))}
                </Space>
            ),
        },
        {
            title: t("promoters:table.actions"),
            key: "actions",
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => save(record.id)}
                            icon={<SaveOutlined />}
                            loading={loading}
                        />
                        <Button
                            onClick={cancel}
                            icon={<CloseOutlined />}
                            danger
                        />
                    </Space>
                ) : (
                    <Space>
                        <Button
                            type="primary"
                            disabled={editingKey !== ""}
                            onClick={() => edit(record)}
                            icon={<EditOutlined />}
                        />
                        <Popconfirm
                            title={t("promoters:messages.confirm.delete")}
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                disabled={editingKey !== ""}
                            />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const EditableCell = ({
        editing,
        dataIndex,
        title,
        inputType,
        record,
        index,
        children,
        ...restProps
    }) => {
        const inputNode =
            inputType === "email" ? (
                <Input type="email" />
            ) : dataIndex === "cpf" ? (
                <Input
                    onChange={(e) =>
                        form.setFieldsValue({
                            cpf: formatCPF(e.target.value),
                        })
                    }
                />
            ) : dataIndex === "phone" ? (
                <Input
                    onChange={(e) =>
                        form.setFieldsValue({
                            phone: formatPhone(e.target.value),
                        })
                    }
                />
            ) : (
                <Input />
            );

        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item
                        name={dataIndex}
                        style={{ margin: 0 }}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    `promoters:form.fields.${dataIndex}.required`
                                ),
                            },
                        ]}
                    >
                        {inputNode}
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };

    return (
        <Card title={t("promoters:list.title")} className="form-title">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Form form={searchForm} onFinish={handleSearch}>
                    <Row justify="space-evenly" gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item name="name">
                                <Input
                                    placeholder={t("promoters:filters.name")}
                                    prefix={<SearchOutlined />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item name="cpf">
                                <Input
                                    placeholder={t("promoters:filters.cpf")}
                                    prefix={<SearchOutlined />}
                                    onChange={(e) =>
                                        searchForm.setFieldsValue({
                                            cpf: formatCPF(e.target.value),
                                        })
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item name="phone">
                                <Input
                                    placeholder={t("promoters:filters.phone")}
                                    prefix={<SearchOutlined />}
                                    onChange={(e) =>
                                        searchForm.setFieldsValue({
                                            phone: formatPhone(e.target.value),
                                        })
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row justify="space-between" gutter={8}>
                        <Row justify="start" gutter={16}>
                            <Col>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SearchOutlined />}
                                    className="form-button"
                                >
                                    {t("promoters:buttons.search")}
                                </Button>
                            </Col>
                            <Col>
                                <Button
                                    onClick={clearFilters}
                                    icon={<ClearOutlined />}
                                    className="form-button clear-button"
                                >
                                    {t("promoters:buttons.clear_filters")}
                                </Button>
                            </Col>
                        </Row>
                        <Col>
                            <Button
                                type="primary"
                                icon={<UserAddOutlined />}
                                onClick={() => navigate("/promoters/new")}
                                className="form-button"
                            >
                                {t("promoters:buttons.new")}
                            </Button>
                        </Col>
                    </Row>
                </Form>

                <Form form={form} component={false}>
                    <Table
                        components={{
                            body: {
                                cell: EditableCell,
                            },
                        }}
                        bordered
                        dataSource={promoters}
                        columns={columns.map((col) => ({
                            ...col,
                            onCell: (record) => ({
                                record,
                                inputType:
                                    col.dataIndex === "email"
                                        ? "email"
                                        : "text",
                                dataIndex: col.dataIndex,
                                title: col.title,
                                editing: isEditing(record),
                            }),
                        }))}
                        rowClassName="editable-row"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) =>
                                t("common:table.pagination.total", {
                                    total,
                                }),
                        }}
                    />
                </Form>
            </Space>
        </Card>
    );
};

export default PromoterList;
