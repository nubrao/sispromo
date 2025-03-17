import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Form, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { LoadingModal } from "../components/LoadingModal";

const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { translateMessage } = useTranslateMessage();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values.username, values.password);
            message.success(translateMessage("login.success"));
            navigate("/dashboard");
        } catch (error) {
            let errorMessage = translateMessage("login.error");

            if (error.response?.data) {
                const errorData = error.response.data;
                if (Array.isArray(errorData)) {
                    errorMessage = errorData
                        .map((err) => translateMessage(err))
                        .join("\n");
                } else if (typeof errorData === "object") {
                    errorMessage = Object.values(errorData)
                        .flat()
                        .map((err) => translateMessage(err))
                        .join("\n");
                } else {
                    errorMessage = translateMessage(errorData);
                }
            }

            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>{translateMessage("login.title")}</h1>
                <Form
                    form={form}
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "login.username.required"
                                ),
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={translateMessage(
                                "login.username.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: translateMessage(
                                    "login.password.required"
                                ),
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={translateMessage(
                                "login.password.placeholder"
                            )}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            {translateMessage("login.submit")}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
            <LoadingModal visible={loading} />
        </div>
    );
};

export default LoginForm;
