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
    Typography
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { formatCPF, formatPhone } from "../utils/formatters";
import api from "../services/api";
import { CopyOutlined } from "@ant-design/icons";
import "../styles/promoter.css";

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

            // Update promoter details
            await api.patch(`/api/users/${id}/`, {
                first_name: values.first_name?.toUpperCase(),
                last_name: values.last_name?.toUpperCase(),
                cpf: values.cpf.replace(/\D/g, ""),
                phone: values.phone.replace(/\D/g, ""),
                email: values.email,
                city: values.city?.toUpperCase(),
                state: values.state?.toUpperCase(),
            });

            // Sync brands
            await api.post('/api/promoter-brands/sync_promoter_brands/', {
                promoter_id: id,
                brands: values.brands
            });

            toast.success(t("promoters:messages.success.update"));
            // Force refresh on list by passing timestamp
            navigate('/promoters', {
                state: {
                    refresh: Date.now(),
                    forceRefresh: true // New flag to force database fetch
                }
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error(t("promoters:messages.errors.save"));
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
            <Card title={t("promoters:form.title.new")} className="form-title">
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
                                    ? t("common:buttons.update")
                                    : t("common:buttons.create_promoter")}
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
