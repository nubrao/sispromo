import { Modal, Form, Input } from "antd";
import { useState } from "react";
import PropTypes from "prop-types";
import { Toast } from "./Toast";
import userRepository from "../repositories/userRepository";

export const ChangePasswordModal = ({ visible, onClose, userId }) => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await userRepository.updateUser(userId, {
                password: values.newPassword,
                password_confirm: values.confirmPassword,
            });
            Toast.showToast("Senha alterada com sucesso!", "success");
            form.resetFields();
            onClose();
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            Toast.showToast("Erro ao alterar senha", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Alterar Senha"
            open={visible}
            onCancel={onClose}
            okText="Confirmar"
            cancelText="Cancelar"
            confirmLoading={loading}
            onOk={() => form.submit()}
            okButtonProps={{
                className: "ant-btn-ok",
            }}
            cancelButtonProps={{
                className: "ant-btn-cancel",
                disabled: loading,
            }}
            closable={!loading}
            maskClosable={!loading}
        >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Form.Item
                    name="newPassword"
                    label="Nova Senha"
                    rules={[
                        { required: true, message: "Digite a nova senha" },
                        {
                            min: 6,
                            message: "A senha deve ter no mínimo 6 caracteres",
                        },
                    ]}
                >
                    <Input.Password placeholder="Digite a nova senha" />
                </Form.Item>
                <Form.Item
                    name="confirmPassword"
                    label="Confirmar Senha"
                    dependencies={["newPassword"]}
                    rules={[
                        { required: true, message: "Confirme a nova senha" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (
                                    !value ||
                                    getFieldValue("newPassword") === value
                                ) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(
                                    "As senhas não coincidem"
                                );
                            },
                        }),
                    ]}
                >
                    <Input.Password placeholder="Confirme a nova senha" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

ChangePasswordModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userId: PropTypes.string,
};

export default ChangePasswordModal;
