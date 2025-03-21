import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/login.css";
import Logo from "../assets/img/logo";

const { Title } = Typography;

const LoginForm = () => {
    const { t } = useTranslation(["auth", "common"]);
    const { login, loading, signed } = useAuth();
    const [form] = Form.useForm();

    // Se já estiver autenticado, redireciona para a dashboard
    if (signed) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (values) => {
        await login(values.username, values.password);
    };

    const handleUsernameChange = (e) => {
        const { value } = e.target;
        form.setFieldsValue({
            username: value.toLowerCase(),
        });
    };

    return (
        <div className="login-container">
            <Card className="login-card">
                <div className="login-header">
                    <Title level={2} className="welcome">
                        {t("auth:login.title")}
                    </Title>
                </div>
                <div className="login-content">
                    <Logo size={100} />
                    <Form
                        form={form}
                        name="login"
                        onFinish={handleSubmit}
                        layout="vertical"
                        className="login-form"
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                {
                                    required: true,
                                    message: t("auth:login.username.required"),
                                },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder={t("auth:login.username.label")}
                                size="large"
                                onChange={handleUsernameChange}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: t("auth:login.password.required"),
                                },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder={t("auth:login.password.label")}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                size="large"
                            >
                                {loading
                                    ? t("auth:login.buttons.processing")
                                    : t("auth:login.buttons.submit")}
                            </Button>
                        </Form.Item>

                        <div className="auth-links">
                            <Link to="/reset-password" className="auth-link">
                                {t("auth:login.buttons.forgot_password")}
                            </Link>
                            <Link to="/register" className="auth-link">
                                {t("auth:register.title")}
                            </Link>
                        </div>
                    </Form>
                </div>
            </Card>
        </div>
    );
};

export default LoginForm;
