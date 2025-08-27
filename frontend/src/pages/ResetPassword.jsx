import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input, Button, Card, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

const { Title } = Typography;

const ResetPassword = () => {
    const { t } = useTranslation(["auth", "common"]);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            await api.post("/api/auth/reset-password/", {
                email: values.email,
            });
            setEmailSent(true);
            toast.success(t("auth:reset_password.messages.check_email"));
        } catch (error) {
            toast.error(t("auth:reset_password.messages.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "#f0f2f5",
            }}
        >
            <Card
                style={{ width: 400, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            >
                <Title
                    level={2}
                    style={{ textAlign: "center", marginBottom: 32 }}
                >
                    {t("auth:reset_password.title")}
                </Title>

                {!emailSent ? (
                    <Form
                        form={form}
                        name="reset-password"
                        onFinish={handleSubmit}
                        layout="vertical"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        "auth:reset_password.form.email.required"
                                    ),
                                },
                                {
                                    type: "email",
                                    message: t(
                                        "auth:reset_password.form.email.invalid"
                                    ),
                                },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder={t(
                                    "auth:reset_password.form.email.placeholder"
                                )}
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
                                    ? t(
                                          "auth:reset_password.buttons.processing"
                                      )
                                    : t("auth:reset_password.buttons.submit")}
                            </Button>
                        </Form.Item>
                    </Form>
                ) : (
                    <div style={{ textAlign: "center" }}>
                        <p>{t("auth:reset_password.messages.check_email")}</p>
                    </div>
                )}

                <div style={{ textAlign: "center", marginTop: 16 }}>
                    <Link to="/login">
                        {t("auth:reset_password.buttons.back_to_login")}
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default ResetPassword;
