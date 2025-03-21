import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/login.css";
import Logo from "../assets/img/logo";
import { Button, Input, Form, Spin } from "antd";
import {
    UserOutlined,
    LockOutlined,
    MailOutlined,
    IdcardOutlined,
    PhoneOutlined,
} from "@ant-design/icons";
import { CustomModal } from "../components/CustomModal";
import { formatCPF, formatPhone } from "../utils/formatters";
import { useToast } from "../components/Toast";
import userRepository from "../repositories/userRepository";

const Register = () => {
    const { t } = useTranslation(["auth", "validation"]);
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState("");

    // Função para validar campo quando perder o foco
    const handleFieldBlur = (field) => {
        form.validateFields([field]);
    };

    // Função para formatar CPF enquanto digita
    const handleCPFChange = (e) => {
        const { value } = e.target;
        const formattedValue = formatCPF(value);
        form.setFieldsValue({ cpf: formattedValue });
    };

    // Função para formatar telefone enquanto digita
    const handlePhoneChange = (e) => {
        const { value } = e.target;
        const formattedValue = formatPhone(value);
        form.setFieldsValue({ phone: formattedValue });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        setErrorMessage("");
        setModalVisible(true);

        try {
            // Extrair os valores do formulário
            const {
                first_name,
                last_name,
                email,
                cpf,
                phone,
                password,
                password_confirm,
            } = values;

            // Verificar se as senhas coincidem
            if (password !== password_confirm) {
                throw new Error(t("validation:password.mismatch"));
            }

            const userData = {
                username: cpf.replace(/\D/g, ""),
                first_name,
                last_name,
                email,
                cpf: cpf.replace(/\D/g, ""),
                telefone: phone.replace(/\D/g, ""),
                password,
                password_confirm,
            };

            await userRepository.registerUser(userData);
            setSuccess(true);
            toast.success("auth:register.success");

            // Aguarda um pouco antes de redirecionar
            setTimeout(() => {
                setModalVisible(false);
                navigate("/login");
            }, 1500);
        } catch (error) {
            setSuccess(false);
            const errorMsg =
                error.response?.data?.error ||
                error.message ||
                t("auth:register.error.generic");
            setErrorMessage(errorMsg);
            toast.error("auth:register.error.generic");

            // Aguarda um pouco antes de fechar o modal
            setTimeout(() => {
                setModalVisible(false);
            }, 1500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <span className="welcome">{t("auth:register.title")}</span>
            <div className="login-container">
                <Logo />
                <Form
                    form={form}
                    name="register"
                    onFinish={handleSubmit}
                    layout="vertical"
                    className="login-form"
                    validateTrigger={["onBlur"]}
                >
                    <Form.Item
                        name="first_name"
                        rules={[
                            {
                                required: true,
                                message: t("auth:register.firstName.required"),
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={t(
                                "auth:register.firstName.placeholder"
                            )}
                            onBlur={() => handleFieldBlur("first_name")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="last_name"
                        rules={[
                            {
                                required: true,
                                message: t("auth:register.lastName.required"),
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={t(
                                "auth:register.lastName.placeholder"
                            )}
                            onBlur={() => handleFieldBlur("last_name")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="cpf"
                        rules={[
                            {
                                required: true,
                                message: t("validation:required"),
                            },
                            {
                                pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                                message: t("validation:format.cpf"),
                            },
                        ]}
                    >
                        <Input
                            prefix={<IdcardOutlined />}
                            placeholder={t("auth:register.cpf.placeholder")}
                            onChange={handleCPFChange}
                            onBlur={() => handleFieldBlur("cpf")}
                            maxLength={14}
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        rules={[
                            {
                                required: true,
                                message: t("validation:required"),
                            },
                            {
                                pattern: /^\(\d{2}\) \d{5}-\d{4}$/,
                                message: t("validation:format.phone"),
                            },
                        ]}
                    >
                        <Input
                            prefix={<PhoneOutlined />}
                            placeholder={t("auth:register.phone.placeholder")}
                            onChange={handlePhoneChange}
                            onBlur={() => handleFieldBlur("phone")}
                            maxLength={15}
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            {
                                required: true,
                                message: t("validation:required"),
                            },
                            {
                                type: "email",
                                message: t("validation:format.email"),
                            },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder={t("auth:register.email.placeholder")}
                            onBlur={() => handleFieldBlur("email")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: t("validation:required"),
                            },
                            {
                                min: 8,
                                message: t("validation:password.requirements"),
                            },
                        ]}
                        validateTrigger={["onChange", "onBlur"]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={t(
                                "auth:register.password.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password_confirm"
                        dependencies={["password"]}
                        rules={[
                            {
                                required: true,
                                message: t("validation:required"),
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("password") === value
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        t("validation:password.mismatch")
                                    );
                                },
                            }),
                        ]}
                        validateTrigger={["onChange", "onBlur"]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={t(
                                "auth:register.confirmPassword.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-button"
                            loading={loading}
                            disabled={loading}
                        >
                            {loading
                                ? t("auth:register.loading")
                                : t("auth:register.submit")}
                        </Button>
                    </Form.Item>
                    <Link to="/login" className="login-form-register">
                        {t("auth:register.loginLink")}
                    </Link>
                </Form>

                <CustomModal
                    loading={loading}
                    success={success}
                    errorMessage={errorMessage}
                    title={t("auth:register.loading")}
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                />
            </div>
        </>
    );
};

export default Register;
