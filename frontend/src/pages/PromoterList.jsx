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
    SaveOutlined,
    CloseOutlined,
    SearchOutlined,
    ClearOutlined,
    UserAddOutlined,
} from "@ant-design/icons";
import { formatPhone } from "../utils/formatters";
import { useNavigate } from "react-router-dom";
import "../styles/promoterForm.css";
import promoterBrandRepository from "../repositories/promoterBrandRepository";
import userRepository from "../repositories/userRepository";
import brandRepository from "../repositories/brandRepository";

const PromoterList = () => {
    const { t } = useTranslation(["promoters", "common"]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [allPromoters, setAllPromoters] = useState([]);
    const [filteredPromoters, setFilteredPromoters] = useState([]);
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
            // Filtra marcas únicas baseado no brand_id
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
            setAllPromoters(promotersList);
            setFilteredPromoters(promotersList);
        } catch (error) {
            message.error(t("promoters:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const isEditing = (record) => record.id === editingKey;

    const edit = (record) => {
        const brands =
            promoterBrands[record.id]?.map((pb) => pb.brand.brand_id) || [];

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

            // Encontra o promotor atual para comparar as alterações
            const currentPromoter = allPromoters.find((p) => p.id === id);

            // Cria objeto apenas com os campos que foram alterados
            const updatedFields = {};

            // Trata o nome apenas se foi alterado
            if (row.full_name) {
                const nameParts = row.full_name.split(" ");
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(" ");

                if (firstName !== currentPromoter.first_name) {
                    updatedFields.first_name = firstName;
                }
                if (lastName !== currentPromoter.last_name) {
                    updatedFields.last_name = lastName || "";
                }
            }

            if (row.email !== currentPromoter.email) {
                updatedFields.email = row.email;
            }

            if (row.phone) {
                const newPhone = row.phone.replace(/\D/g, "");
                if (newPhone !== currentPromoter.phone) {
                    updatedFields.phone = newPhone;
                }
            }

            // Só faz o PATCH se houver campos alterados
            if (Object.keys(updatedFields).length > 0) {
                await userRepository.updateUser(id, updatedFields);
            }

            // Atualizar marcas do promotor
            const currentBrands =
                promoterBrands[id]?.map((pb) => pb.brand.brand_id) || [];
            const selectedBrands = row.brands || [];

            // Processa todas as alterações de marcas
            const promises = [];

            // Remover marcas que não estão mais selecionadas
            const brandsToRemove = currentBrands.filter(
                (brandId) => !selectedBrands.includes(brandId)
            );

            // Identificar apenas as novas marcas que não existem atualmente
            const brandsToAdd = selectedBrands.filter(
                (brandId) => !currentBrands.includes(brandId)
            );

            // Remove as marcas não selecionadas
            for (const brandId of brandsToRemove) {
                const promoterBrand = promoterBrands[id].find(
                    (pb) => pb.brand.brand_id === brandId
                );
                if (promoterBrand) {
                    promises.push(
                        promoterBrandRepository.deletePromoterBrand(
                            promoterBrand.id
                        )
                    );
                }
            }

            // Adiciona apenas as novas marcas
            for (const brandId of brandsToAdd) {
                promises.push(
                    promoterBrandRepository.createPromoterBrand(id, brandId)
                );
            }

            // Aguarda todas as operações de marca terminarem
            if (promises.length > 0) {
                await Promise.all(promises);
            }

            // Só mostra mensagem de sucesso se houve alguma alteração
            if (Object.keys(updatedFields).length > 0 || promises.length > 0) {
                message.success(t("promoters:messages.success.update"));
            }

            setEditingKey("");
            loadPromoters();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            message.error(t("promoters:messages.error.update"));
        }
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

            // Verifica se o promotor tem pelo menos uma das marcas selecionadas
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

    const EditableCell = ({
        editing,
        dataIndex,
        title,
        record,
        children,
        ...restProps
    }) => {
        let inputNode;

        if (dataIndex === "full_name") {
            inputNode = (
                <Input
                    placeholder={title}
                    defaultValue={
                        record ? `${record.first_name} ${record.last_name}` : ""
                    }
                />
            );
        } else if (dataIndex === "brands") {
            inputNode = (
                <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Selecione as marcas"
                    className="transparent-select"
                    popupClassName="transparent-select-dropdown"
                    options={availableBrands.map((brand) => ({
                        value: brand.id,
                        label: brand.brand_name.toUpperCase(),
                    }))}
                    onChange={(value) => {
                        form.setFieldsValue({ [dataIndex]: value });
                    }}
                />
            );
        } else if (dataIndex === "phone") {
            inputNode = (
                <Input
                    placeholder={title}
                    maxLength={15}
                    value={formatPhone(form.getFieldValue("phone") || "")}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
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
            title: t("promoters:table.name"),
            dataIndex: "first_name",
            editable: true,
            width: "20%",
            render: (_, record) => `${record.first_name} ${record.last_name}`,
        },
        {
            title: t("promoters:table.last_name"),
            dataIndex: "last_name",
            editable: true,
            width: "15%",
            render: (text) => text,
            shouldShow: (record) => isEditing(record),
        },
        {
            title: t("promoters:table.email"),
            dataIndex: "email",
            editable: true,
            width: "25%",
        },
        {
            title: t("promoters:table.phone"),
            dataIndex: "phone",
            key: "phone",
            editable: true,
            render: (phone) => formatPhone(phone),
            width: "15%",
        },
        {
            title: t("promoters:table.brands"),
            dataIndex: "brands",
            key: "brands",
            editable: true,
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
            width: "30%",
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
                        >
                            {t("promoters:buttons.save")}
                        </Button>
                        <Button onClick={cancel} icon={<CloseOutlined />}>
                            {t("promoters:buttons.cancel")}
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
                    </Space>
                );
            },
            width: "20%",
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
                    <div className="search-buttons">
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
                    dataSource={filteredPromoters}
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
