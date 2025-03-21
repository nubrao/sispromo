import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Form, Input, Select, Button, Space } from "antd";
import { toast } from "react-toastify";
import api from "../services/api";

const UserForm = () => {
    const { t } = useTranslation(["users", "common"]);
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!id;

    useEffect(() => {
        if (isEditing) {
            loadUser();
        }
    }, [isEditing]);

    const loadUser = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/users/${id}/`);
            form.setFieldsValue({
                name: response.data.name,
                email: response.data.email,
                role: response.data.role,
            });
        } catch (error) {
            console.error("Erro ao carregar usuário:", error);
            toast.error(t("users:messages.error.load"));
            navigate("/users");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            if (isEditing) {
                await api.put(`/api/users/${id}/`, values);
                toast.success(t("users:messages.success.update"));
            } else {
                await api.post("/api/users/", values);
                toast.success(t("users:messages.success.create"));
            }
            navigate("/users");
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            if (error.response?.data?.email) {
                toast.error(t("users:messages.error.duplicate_email"));
            } else {
                toast.error(
                    t(`users:messages.error.${isEditing ? "update" : "create"}`)
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={t(`users:form.title.${isEditing ? "edit" : "new"}`)}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ role: 1 }}
            >
                <Form.Item
                    name="name"
                    label={t("users:form.fields.name.label")}
                    rules={[
                        {
                            required: true,
                            message: t("users:form.fields.name.required"),
                        },
                    ]}
                >
                    <Input
                        placeholder={t("users:form.fields.name.placeholder")}
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label={t("users:form.fields.email.label")}
                    rules={[
                        {
                            required: true,
                            message: t("users:form.fields.email.required"),
                        },
                        {
                            type: "email",
                            message: t("users:form.fields.email.invalid"),
                        },
                    ]}
                >
                    <Input
                        placeholder={t("users:form.fields.email.placeholder")}
                    />
                </Form.Item>

                {!isEditing && (
                    <>
                        <Form.Item
                            name="password"
                            label={t("users:form.fields.password.label")}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        "users:form.fields.password.required"
                                    ),
                                },
                            ]}
                        >
                            <Input.Password
                                placeholder={t(
                                    "users:form.fields.password.placeholder"
                                )}
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirm_password"
                            label={t(
                                "users:form.fields.password.confirm.label"
                            )}
                            dependencies={["password"]}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        "users:form.fields.password.confirm.required"
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
                                            new Error(
                                                t(
                                                    "users:form.fields.password.confirm.mismatch"
                                                )
                                            )
                                        );
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                placeholder={t(
                                    "users:form.fields.password.confirm.placeholder"
                                )}
                            />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    name="role"
                    label={t("users:form.fields.role.label")}
                    rules={[
                        {
                            required: true,
                            message: t("users:form.fields.role.required"),
                        },
                    ]}
                >
                    <Select
                        placeholder={t("users:form.fields.role.placeholder")}
                    >
                        <Select.Option value={3}>
                            {t("users:roles.3")}
                        </Select.Option>
                        <Select.Option value={2}>
                            {t("users:roles.2")}
                        </Select.Option>
                        <Select.Option value={1}>
                            {t("users:roles.1")}
                        </Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            {loading
                                ? t("users:form.buttons.processing")
                                : t("users:form.buttons.save")}
                        </Button>
                        <Button onClick={() => navigate("/users")}>
                            {t("users:form.buttons.cancel")}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default UserForm;
