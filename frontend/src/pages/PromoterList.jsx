import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Table,
    Input,
    Space,
    Button,
    Card,
    Form,
    message,
    Row,
    Col,
    Tag,
    Select,
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
import { useNavigate } from "react-router-dom";
import "../styles/promoterForm.css";
import promoterBrandRepository from "../repositories/promoterBrandRepository";
import userRepository from "../repositories/userRepository";
import brandRepository from "../repositories/brandRepository";

const PromoterList = () => {
    const { t } = useTranslation(["promoters", "common"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [promoters, setPromoters] = useState([]);
    const [promoterBrands, setPromoterBrands] = useState({});
    const [availableBrands, setAvailableBrands] = useState([]);
    const [editingKey, setEditingKey] = useState("");
    const [form] = Form.useForm();
    const [searchForm] = Form.useForm();

    useEffect(() => {
        loadPromoters();
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            const response = await brandRepository.getAllBrands();
            setAvailableBrands(response);
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

            // Filtra apenas usuários com role = 1 (promotores)
            const promotersList = usersResponse.filter(
                (user) => user.role === 1
            );

            // Organiza as marcas por promoter_id
            const brandsByPromoter = brandsResponse.reduce((acc, brand) => {
                if (!acc[brand.promoter.id]) {
                    acc[brand.promoter.id] = [];
                }
                acc[brand.promoter.id].push(brand);
                return acc;
            }, {});

            setPromoterBrands(brandsByPromoter);
            setPromoters(promotersList);
        } catch (error) {
            message.error(t("promoters:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await userRepository.deleteUser(id);
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
        const brands =
            promoterBrands[record.id]?.map((pb) => pb.brand.id) || [];
        form.setFieldsValue({
            ...record,
            brands: brands,
            full_name: `${record.first_name} ${record.last_name}`,
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
            const [firstName, lastName] = row.full_name.split(" ");

            // Atualizar dados do promotor
            await userRepository.updateUser(id, {
                first_name: firstName,
                last_name: lastName || "",
                email: row.email,
                cpf: row.cpf.replace(/\D/g, ""),
                phone: row.phone.replace(/\D/g, ""),
            });

            // Atualizar marcas do promotor
            const currentBrands =
                promoterBrands[id]?.map((pb) => pb.brand.id) || [];
            const newBrands = row.brands || [];

            // Remover marcas que não estão mais selecionadas
            const brandsToRemove = currentBrands.filter(
                (b) => !newBrands.includes(b)
            );
            for (const brandId of brandsToRemove) {
                const promoterBrand = promoterBrands[id].find(
                    (pb) => pb.brand.id === brandId
                );
                if (promoterBrand) {
                    await promoterBrandRepository.deletePromoterBrand(
                        promoterBrand.id
                    );
                }
            }

            // Adicionar novas marcas
            const brandsToAdd = newBrands.filter(
                (b) => !currentBrands.includes(b)
            );
            for (const brandId of brandsToAdd) {
                await promoterBrandRepository.createPromoterBrand(id, brandId);
            }

            message.success(t("promoters:messages.success.update"));
            setEditingKey("");
            loadPromoters();
        } catch (error) {
            message.error(t("promoters:messages.error.update"));
        }
    };

    const handleSearch = () => {
        const values = searchForm.getFieldsValue();
        const filteredData = promoters.filter((item) => {
            const nameMatch = values.name
                ? `${item.first_name} ${item.last_name}`
                      .toLowerCase()
                      .includes(values.name.toLowerCase())
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

    const EditableCell = ({
        editing,
        dataIndex,
        title,
        record,
        children,
        ...restProps
    }) => {
        let inputNode;

        if (dataIndex === "brands") {
            // Filtra marcas duplicadas baseado no brand_name
            const uniqueBrands = Array.from(
                new Set(availableBrands.map((brand) => brand.brand_name))
            ).map((name) =>
                availableBrands.find((brand) => brand.brand_name === name)
            );

            inputNode = (
                <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Selecione as marcas"
                    className="transparent-select"
                    popupClassName="transparent-select-dropdown"
                    options={uniqueBrands.map((brand) => ({
                        value: brand.id,
                        label: brand.brand_name.toUpperCase(),
                    }))}
                    onChange={(value) => {
                        form.setFieldsValue({ [dataIndex]: value });
                    }}
                />
            );
        } else if (dataIndex === "first_name" || dataIndex === "last_name") {
            inputNode = <Input placeholder={title} />;
        } else if (dataIndex === "phone") {
            inputNode = (
                <Input
                    placeholder={title}
                    maxLength={15}
                    value={formatPhone(form.getFieldValue("phone") || "")}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const formattedValue = formatPhone(value);
                        form.setFieldsValue({ phone: value });
                    }}
                />
            );
        } else {
            inputNode = <Input />;
        }

        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item
                        name={dataIndex}
                        style={{ margin: 0 }}
                        rules={[
                            {
                                required: true,
                                message: `Por favor, preencha o campo ${title}!`,
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

    const columns = [
        {
            title: "Nome",
            dataIndex: "first_name",
            editable: true,
            width: "20%",
            render: (_, record) => `${record.first_name} ${record.last_name}`,
        },
        {
            title: "Sobrenome",
            dataIndex: "last_name",
            editable: true,
            width: "15%",
            render: (text) => text,
            shouldShow: (record) => isEditing(record),
        },
        {
            title: "Email",
            dataIndex: "email",
            editable: true,
            width: "25%",
        },
        {
            title: "Telefone",
            dataIndex: "phone",
            editable: true,
            width: "15%",
            render: (text) => formatPhone(text),
        },
        {
            title: "Marcas",
            dataIndex: "brands",
            editable: true,
            width: "15%",
            render: (_, record) => (
                <>
                    {promoterBrands[record.id]?.map((pb) => (
                        <Tag key={pb.brand.id} color="blue">
                            {pb.brand.brand_name}
                        </Tag>
                    ))}
                </>
            ),
        },
        {
            title: "Ações",
            dataIndex: "operation",
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Space>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={() => save(record.id)}
                        >
                            Salvar
                        </Button>
                        <Button icon={<CloseOutlined />} onClick={cancel}>
                            Cancelar
                        </Button>
                    </Space>
                ) : (
                    <Space>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => edit(record)}
                            disabled={editingKey !== ""}
                            className="form-button edit-button"
                        >
                            {t("promoters:buttons.edit")}
                        </Button>
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                            disabled={editingKey !== ""}
                            className="form-button delete-button"
                        >
                            {t("promoters:buttons.delete")}
                        </Button>
                    </Space>
                );
            },
        },
    ];

    const mergedColumns = columns
        .map((col) => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record) => ({
                    record,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: isEditing(record),
                }),
            };
        })
        .filter((col) => {
            if (col.dataIndex === "last_name") {
                return editingKey !== "";
            }
            return true;
        });

    return (
        <>
            <Card title={t("promoters:title")} className="form-title">
                <Form form={searchForm} layout="vertical" className="form">
                    <Row gutter={16} className="form-row">
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="name"
                                label={t("promoters:search.name")}
                                className="form-input"
                            >
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder={t("promoters:search.name")}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="cpf"
                                label={t("promoters:search.cpf")}
                                className="form-input"
                            >
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder={t("promoters:search.cpf")}
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
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="search-buttons">
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            className="form-button"
                        >
                            {t("common:buttons.search")}
                        </Button>
                        <Button
                            type="default"
                            icon={<ClearOutlined />}
                            onClick={clearFilters}
                            className="form-button clear-button"
                        >
                            {t("common:buttons.clear_filters")}
                        </Button>
                    </div>
                </Form>
            </Card>
            <div className="add-button">
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => navigate("/promoters/new")}
                    className="form-button"
                >
                    {t("promoters:buttons.new")}
                </Button>
            </div>

            <Form form={form} component={false}>
                <Table
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    dataSource={promoters}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    loading={loading}
                    pagination={{
                        onChange: cancel,
                    }}
                />
            </Form>
        </>
    );
};

export default PromoterList;
