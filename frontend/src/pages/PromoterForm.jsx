import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Form,
    Input,
    Button,
    Card,
    Select,
    Space,
    Modal,
    Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { formatCPF, formatPhone } from "../utils/formatters";
import api from "../services/api";
import { CopyOutlined } from "@ant-design/icons";
import "../styles/promoterForm.css";

const { Title, Text } = Typography;

const PromoterForm = () => {
    const { t } = useTranslation(["promoters", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [tempPassword, setTempPassword] = useState("");

    useEffect(() => {
        loadBrands();
        if (id) {
            loadPromoter();
        }
    }, [id]);

    const loadBrands = async () => {
        try {
            const response = await api.get("/api/brands/");
            // Filtra marcas duplicadas usando um Map para manter apenas uma ocorrência por brand_id
            const uniqueBrands = Array.from(
                new Map(
                    response.data.map((brand) => [brand.brand_id, brand])
                ).values()
            );
            setBrands(uniqueBrands);
        } catch {
            toast.error(t("promoters:messages.error.load_brands"));
        }
    };

    const loadPromoter = async () => {
        try {
            setLoading(true);
            const [userResponse, brandsResponse] = await Promise.all([
                api.get(`/api/users/${id}/`),
                api.get(`/api/promoter-brands/?promoter_id=${id}`),
            ]);

            // Formata os dados do usuário
            form.setFieldsValue({
                ...userResponse.data,
                cpf: formatCPF(userResponse.data.cpf),
                phone: formatPhone(userResponse.data.phone),
                brands: brandsResponse.data.map((pb) => pb.brand.brand_id),
            });
        } catch (error) {
            console.error("Erro ao carregar promotor:", error);
            toast.error(t("promoters:messages.error.load"));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const cpfClean = values.cpf.replace(/\D/g, "");
            const data = {
                ...values,
                cpf: cpfClean,
                phone: values.phone.replace(/\D/g, ""),
                role: 1,
                username: cpfClean,
                password: cpfClean.substring(0, 6),
                password_confirm: cpfClean.substring(0, 6),
            };

            let userId;

            if (id) {
                // Atualiza o promotor existente
                await api.patch(`/api/users/${id}/`, data);
                userId = id;
            } else {
                // Cria novo promotor
                const response = await api.post("/api/users/register/", data);
                userId = response.data.id;
                setTempPassword(cpfClean.substring(0, 6));
                setShowPasswordModal(true);
            }

            // Salva as marcas selecionadas
            if (values.brands && values.brands.length > 0) {
                const promises = values.brands.map((brandId) =>
                    api.post("/api/promoter-brands/", {
                        promoter_id: userId,
                        brand_id: brandId,
                    })
                );

                await Promise.all(promises);
            }

            if (id) {
                toast.success(t("promoters:messages.success.update"));
                navigate("/promoters");
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            const errors = error.response?.data;
            if (errors) {
                Object.keys(errors).forEach((key) => {
                    toast.error(`${key}: ${errors[key].join(" ")}`);
                });
            } else {
                toast.error(
                    id
                        ? t("promoters:messages.error.update")
                        : t("promoters:messages.error.create")
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(tempPassword);
            toast.success(t("promoters:messages.success.password_copied"));
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = tempPassword;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand("copy");
                toast.success(t("promoters:messages.success.password_copied"));
            } catch (err) {
                toast.error(t("promoters:messages.error.password_copy_failed"));
            }
            document.body.removeChild(textArea);
        }
    };

    const handleClosePasswordModal = () => {
        setShowPasswordModal(false);
        navigate("/promoters");
    };

    const handleCPFChange = (e) => {
        const { value } = e.target;
        form.setFieldsValue({
            cpf: formatCPF(value),
        });
    };

    const handlePhoneChange = (e) => {
        const { value } = e.target;
        form.setFieldsValue({
            phone: formatPhone(value),
        });
    };

    return (
        <>
            <Card
                title={t("promoters:form.title.create")}
                className="form-title"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="form"
                >
                    <Form.Item
                        name="first_name"
                        label={t("promoters:form.fields.first_name.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "promoters:form.fields.first_name.required"
                                ),
                            },
                        ]}
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "promoters:form.fields.first_name.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="last_name"
                        label={t("promoters:form.fields.last_name.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "promoters:form.fields.last_name.required"
                                ),
                            },
                        ]}
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "promoters:form.fields.last_name.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="cpf"
                        label={t("promoters:form.fields.cpf.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "promoters:form.fields.cpf.required"
                                ),
                            },
                            {
                                pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                                message: t("promoters:form.fields.cpf.invalid"),
                            },
                        ]}
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "promoters:form.fields.cpf.placeholder"
                            )}
                            onChange={handleCPFChange}
                            maxLength={14}
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label={t("promoters:form.fields.phone.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "promoters:form.fields.phone.required"
                                ),
                            },
                            {
                                pattern: /^\(\d{2}\) \d{5}-\d{4}$/,
                                message: t(
                                    "promoters:form.fields.phone.invalid"
                                ),
                            },
                        ]}
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "promoters:form.fields.phone.placeholder"
                            )}
                            onChange={handlePhoneChange}
                            maxLength={15}
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label={t("promoters:form.fields.email.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "promoters:form.fields.email.required"
                                ),
                            },
                            {
                                type: "email",
                                message: t(
                                    "promoters:form.fields.email.invalid"
                                ),
                            },
                        ]}
                        className="form-input"
                    >
                        <Input
                            placeholder={t(
                                "promoters:form.fields.email.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="brands"
                        label={t("promoters:form.fields.brands.label")}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    "promoters:form.fields.brands.required"
                                ),
                            },
                        ]}
                        className="form-input"
                    >
                        <Select
                            mode="multiple"
                            placeholder={t(
                                "promoters:form.fields.brands.placeholder"
                            )}
                            options={brands.map((brand) => ({
                                value: brand.brand_id,
                                label: brand.brand_name.toUpperCase(),
                            }))}
                            className="brand-select"
                        />
                    </Form.Item>

                    <Form.Item className="form-actions">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="form-button"
                            >
                                {id
                                    ? t("promoters:buttons.update")
                                    : t("promoters:buttons.create")}
                            </Button>
                            <Button
                                onClick={() => navigate("/promoters")}
                                className="form-button clear-button"
                            >
                                {t("promoters:buttons.cancel")}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Modal
                title={t("promoters:modal.password.title")}
                open={showPasswordModal}
                onOk={handleClosePasswordModal}
                onCancel={handleClosePasswordModal}
                footer={[
                    <Button
                        key="copy"
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={handleCopyPassword}
                        className="form-button"
                    >
                        {t("promoters:modal.password.copy")}
                    </Button>,
                    <Button
                        key="ok"
                        type="primary"
                        onClick={handleClosePasswordModal}
                        className="form-button"
                    >
                        {t("promoters:modal.password.ok")}
                    </Button>,
                ]}
            >
                <Space direction="vertical">
                    <Text>{t("promoters:modal.password.description")}</Text>
                    <Title level={3} className="temp-password">
                        {tempPassword}
                    </Title>
                </Space>
            </Modal>
        </>
    );
};

export default PromoterForm;
