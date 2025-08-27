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
            const cleanCPF = values.cpf.replace(/\D/g, "");

            const promoterData = {
                ...values,
                cpf: cleanCPF,
                phone: values.phone.replace(/\D/g, ""),
                first_name: values.first_name?.toUpperCase() || "",
                last_name: values.last_name?.toUpperCase() || "",
                city: values.city?.toUpperCase() || "",
                state: values.state?.toUpperCase() || "",
            };

            let promoterId = id;
            if (!id) {
                promoterData.username = cleanCPF;
                promoterData.password = cleanCPF.substring(0, 6);
                promoterData.password_confirm = cleanCPF.substring(0, 6);
            }

            if (id) {
                await api.patch(`/api/users/${id}/`, promoterData);
                toast.success(t("promoters:messages.success.update"));
            } else {
                const response = await api.post("/api/users/register/", promoterData);
                toast.success(t("promoters:messages.success.create"));
                promoterId = response.data.id;

                setTempPassword(cleanCPF.substring(0, 6));
                setShowPasswordModal(true);
            }

            if (values.brands) {
                try {
                    const currentBrandsResponse = await api.get(
                        `/api/promoter-brands/?promoter_id=${promoterId}`
                    );
                    const currentBrands = currentBrandsResponse.data.map(
                        (pb) => pb.brand.brand_id
                    );

                    const brandsToRemove = currentBrands.filter(
                        (brandId) => !values.brands.includes(brandId)
                    );
                    const brandsToAdd = values.brands.filter(
                        (brandId) => !currentBrands.includes(brandId)
                    );

                    for (const brandId of brandsToRemove) {
                        const relationResponse = await api.get(
                            `/api/promoter-brands/?promoter_id=${promoterId}&brand_id=${brandId}`
                        );
                        if (relationResponse.data.length > 0) {
                            const relationId = relationResponse.data[0].id;
                            await api.delete(
                                `/api/promoter-brands/${relationId}/`
                            );
                        }
                    }

                    for (const brandId of brandsToAdd) {
                        await api.post("/api/promoter-brands/", {
                            promoter_id: promoterId,
                            brand_id: brandId,
                        });
                    }
                } catch (error) {
                    console.error("Erro ao atualizar marcas:", error);
                    toast.error(t("promoters:messages.error.update_brands"));
                }
            }

            navigate("/promoters");
        } catch (error) {
            console.error("Erro ao salvar:", error);

            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === "object") {
                    Object.keys(errorData).forEach((key) => {
                        const errorMessage = Array.isArray(errorData[key])
                            ? errorData[key].join(", ")
                            : errorData[key];
                        toast.error(`${key}: ${errorMessage}`);
                    });
                } else {
                    toast.error(errorData);
                }
            } else {
                toast.error(t("promoters:messages.error.save"));
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
