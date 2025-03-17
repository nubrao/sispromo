import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";
import Logo from "../assets/img/logo";
import { Button, Input, Form, message } from "antd";
import {
    UserOutlined,
    LockOutlined,
    MailOutlined,
    IdcardOutlined,
    PhoneOutlined,
} from "@ant-design/icons";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import { LoadingModal } from "../components/LoadingModal";
import { formatCPF, formatPhone } from "../hooks/useMask";

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const { translateMessage } = useTranslateMessage();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === "cpf") {
            formattedValue = formatCPF(value);
        } else if (name === "phone") {
            formattedValue = formatPhone(value);
        }

        form.setFieldValue(name, formattedValue);
    };

    // Função para validar campo quando perder o foco
    const handleFieldBlur = (field) => {
        form.validateFields([field]);
    };

    const onFinish = async (values) => {
        setLoading(true);
        setModalVisible(true);
        setSuccess(false);

        if (values.password !== values.password_confirm) {
            form.setFields([
                {
                    name: "password_confirm",
                    errors: [translateMessage("register.password.mismatch")],
                },
            ]);
            setLoading(false);
            setModalVisible(false);
            return;
        }

        // Validação do CPF (formato básico)
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        if (!cpfRegex.test(values.cpf)) {
            form.setFields([
                {
                    name: "cpf",
                    errors: [translateMessage("register.cpf.invalid")],
                },
            ]);
            setLoading(false);
            setModalVisible(false);
            return;
        }

        // Validação do telefone (formato básico)
        const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
        if (!phoneRegex.test(values.phone)) {
            form.setFields([
                {
                    name: "phone",
                    errors: [translateMessage("register.phone.invalid")],
                },
            ]);
            setLoading(false);
            setModalVisible(false);
            return;
        }

        // Remove caracteres especiais do CPF para usar como username
        const username = values.cpf.replace(/\D/g, "");

        try {
            const response = await axios.post(
                `${API_URL}/api/users/register/`,
                {
                    username: username, // Usa o CPF como username
                    email: values.email,
                    password: values.password,
                    password_confirm: values.password_confirm,
                    first_name: values.first_name,
                    last_name: values.last_name,
                    cpf: values.cpf,
                    phone: values.phone,
                    role: "promoter", // Papel padrão para novos usuários
                }
            );

            if (response.status === 201) {
                setSuccess(true);
                message.success(translateMessage("register.success"));
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        } catch (error) {
            console.error("Erro ao registrar:", error.response?.data);

            if (error.response?.data) {
                const errorData = error.response.data;
                const fieldErrors = [];

                // Função auxiliar para adicionar erro a um campo
                const addFieldError = (field, message) => {
                    fieldErrors.push({
                        name: field,
                        errors: [translateMessage(message)],
                    });
                };

                if (typeof errorData === "object") {
                    Object.entries(errorData).forEach(([field, errors]) => {
                        if (Array.isArray(errors)) {
                            errors.forEach((error) => {
                                if (error.includes("already exists")) {
                                    addFieldError("cpf", "register.cpf.exists");
                                } else if (
                                    error.includes("CPF deve conter 11 dígitos")
                                ) {
                                    addFieldError("cpf", "register.cpf.format");
                                } else if (
                                    error.includes(
                                        "Telefone deve ter entre 10 e 11 dígitos"
                                    )
                                ) {
                                    addFieldError(
                                        "phone",
                                        "register.phone.format"
                                    );
                                } else if (error.includes("senha")) {
                                    addFieldError(
                                        "password",
                                        "register.password.invalid"
                                    );
                                } else if (error.includes("email")) {
                                    addFieldError(
                                        "email",
                                        "register.email.invalid"
                                    );
                                } else {
                                    // Se não conseguir identificar o campo específico
                                    message.error(translateMessage(error));
                                }
                            });
                        } else if (typeof errors === "string") {
                            if (errors.includes("CPF deve conter 11 dígitos")) {
                                addFieldError("cpf", "register.cpf.format");
                            } else if (
                                errors.includes(
                                    "Telefone deve ter entre 10 e 11 dígitos"
                                )
                            ) {
                                addFieldError("phone", "register.phone.format");
                            } else if (errors.includes("senha")) {
                                addFieldError(
                                    "password",
                                    "register.password.invalid"
                                );
                            } else if (errors.includes("email")) {
                                addFieldError(
                                    "email",
                                    "register.email.invalid"
                                );
                            } else {
                                // Se não conseguir identificar o campo específico
                                message.error(translateMessage(errors));
                            }
                        }
                    });
                } else {
                    message.error(translateMessage(errorData));
                }

                // Define todos os erros de campos de uma vez
                if (fieldErrors.length > 0) {
                    form.setFields(fieldErrors);
                }
            }
            setSuccess(false);
        } finally {
            setLoading(false);
            setModalVisible(false);
        }
    };

    return (
        <>
            <span className="welcome">
                {translateMessage("register.title")}
            </span>
            <div className="login-container">
                <Logo />
                <Form
                    form={form}
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                    className="login-form"
                    validateTrigger={["onBlur"]}
                >
                    <Form.Item
                        name="first_name"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "register.firstName.required"
                                ),
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={translateMessage(
                                "register.firstName.placeholder"
                            )}
                            onBlur={() => handleFieldBlur("first_name")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="last_name"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "register.lastName.required"
                                ),
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={translateMessage(
                                "register.lastName.placeholder"
                            )}
                            onBlur={() => handleFieldBlur("last_name")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="cpf"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "register.cpf.required"
                                ),
                            },
                            {
                                pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                                message: translateMessage(
                                    "register.cpf.invalid"
                                ),
                            },
                        ]}
                    >
                        <Input
                            prefix={<IdcardOutlined />}
                            placeholder={translateMessage(
                                "register.cpf.placeholder"
                            )}
                            onChange={handleInputChange}
                            onBlur={() => handleFieldBlur("cpf")}
                            name="cpf"
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "register.phone.required"
                                ),
                            },
                            {
                                pattern: /^\(\d{2}\) \d{5}-\d{4}$/,
                                message: translateMessage(
                                    "register.phone.invalid"
                                ),
                            },
                        ]}
                    >
                        <Input
                            prefix={<PhoneOutlined />}
                            placeholder={translateMessage(
                                "register.phone.placeholder"
                            )}
                            onChange={handleInputChange}
                            onBlur={() => handleFieldBlur("phone")}
                            name="phone"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "register.email.required"
                                ),
                            },
                            {
                                type: "email",
                                message: translateMessage(
                                    "register.email.invalid"
                                ),
                            },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder={translateMessage(
                                "register.email.placeholder"
                            )}
                            onBlur={() => handleFieldBlur("email")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "register.password.required"
                                ),
                            },
                        ]}
                        validateTrigger={["onChange", "onBlur"]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={translateMessage(
                                "register.password.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password_confirm"
                        dependencies={["password"]}
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "register.confirmPassword.required"
                                ),
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
                                        translateMessage(
                                            "register.password.mismatch"
                                        )
                                    );
                                },
                            }),
                        ]}
                        validateTrigger={["onChange", "onBlur"]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={translateMessage(
                                "register.confirmPassword.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-button"
                            loading={loading}
                        >
                            {translateMessage("register.submit")}
                        </Button>
                    </Form.Item>
                    <Link to="/login" className="login-form-register">
                        {translateMessage("register.loginLink")}
                    </Link>
                </Form>

                {success && (
                    <div className="success-message">
                        {translateMessage("register.success")}
                    </div>
                )}

                <LoadingModal
                    visible={modalVisible}
                    onCancel={() => setModalVisible(false)}
                />
            </div>
        </>
    );
};

export default Register;
