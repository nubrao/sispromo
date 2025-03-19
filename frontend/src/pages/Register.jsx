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
import { CustomModal } from "../components/CustomModal";
import { formatCPF, formatPhone } from "../hooks/useMask";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import userRepository from "../repositories/userRepository";

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const { translateMessage } = useTranslateMessage();
    const [errorMessage, setErrorMessage] = useState("");

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");

        if (password !== confirmPassword) {
            setErrorMessage("As senhas não coincidem");
            setLoading(false);
            return;
        }

        const userData = {
            first_name: firstName,
            last_name: lastName,
            email,
            cpf: cpf.replace(/\D/g, ""),
            phone: phone.replace(/\D/g, ""),
            password,
            password_confirm: confirmPassword,
            role,
        };

        try {
            await userRepository.registerUser(userData);
            showToast("Usuário registrado com sucesso!", "success");
            navigate("/login");
        } catch (error) {
            let errorMsg = "Erro ao registrar usuário.";

            if (error.response?.data?.cpf) {
                errorMsg = await translateMessage(error.response.data.cpf[0]);
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }

            setErrorMessage(errorMsg);
            showToast(errorMsg, "error");
        } finally {
            setLoading(false);
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
                            {
                                validator: (_, value) => {
                                    const numbers = value?.replace(/\D/g, "");
                                    if (numbers && numbers.length !== 11) {
                                        return Promise.reject(
                                            translateMessage(
                                                "register.cpf.length"
                                            )
                                        );
                                    }
                                    return Promise.resolve();
                                },
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
                            maxLength={14}
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

                <CustomModal
                    loading={loading}
                    success={success}
                    errorMessage={errorMessage}
                    title={"Processando..."}
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                />
            </div>
        </>
    );
};

export default Register;
