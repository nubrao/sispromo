import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/modal.css";
import { Form, Input, Modal } from "antd";

const EditUserModal = ({ open, setOpen, user, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (open && user) {
            const formattedData = {
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                username: user.username || "",
                cpf: formatCPF(user.profile?.cpf) || "",
                phone: formatPhone(user.profile?.phone) || "",
            };
            form.setFieldsValue(formattedData);
        }
    }, [open, user, form]);

    const formatCPF = (cpf) => {
        if (!cpf) return "";
        const numbers = cpf.replace(/\D/g, "");
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    };

    const formatPhone = (phone) => {
        if (!phone) return "";
        const numbers = phone.replace(/\D/g, "");
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    };

    const validateCPF = (cpf) => {
        const numbers = cpf.replace(/\D/g, "");

        if (numbers.length !== 11) {
            return false;
        }

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(numbers)) {
            return false;
        }

        // Validação dos dígitos verificadores
        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) {
            sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(numbers.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(numbers.substring(10, 11))) return false;

        return true;
    };

    const handleSubmit = async (values) => {
        const cpfNumbers = values.cpf.replace(/\D/g, "");
        const phoneNumbers = values.phone.replace(/\D/g, "");

        if (!validateCPF(cpfNumbers)) {
            form.setFields([
                {
                    name: "cpf",
                    errors: ["CPF inválido"],
                },
            ]);
            return;
        }

        if (phoneNumbers.length !== 11) {
            form.setFields([
                {
                    name: "phone",
                    errors: ["Telefone deve ter 11 dígitos"],
                },
            ]);
            return;
        }

        setLoading(true);
        try {
            const dataToSend = {
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                profile: {
                    cpf: cpfNumbers,
                    phone: phoneNumbers,
                },
            };
            await onSave(dataToSend);
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setOpen(false);
    };

    return (
        <Modal
            title="Editar Usuário"
            open={open}
            onOk={() => form.submit()}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText="Confirmar"
            cancelText="Cancelar"
            okButtonProps={{
                type: "primary",
                loading: loading,
                className: "ant-btn-ok",
            }}
            cancelButtonProps={{
                type: "default",
                className: "ant-btn-cancel",
            }}
            destroyOnClose
        >
            <Form
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                preserve={false}
                initialValues={{
                    first_name: user?.first_name || "",
                    last_name: user?.last_name || "",
                    email: user?.email || "",
                    username: user?.username || "",
                    cpf: formatCPF(user?.profile?.cpf) || "",
                    phone: formatPhone(user?.profile?.phone) || "",
                }}
            >
                <Form.Item name="username" label="Usuário">
                    <Input disabled />
                </Form.Item>

                <Form.Item
                    name="first_name"
                    label="Nome"
                    rules={[{ required: true, message: "Informe o nome" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="last_name"
                    label="Sobrenome"
                    rules={[{ required: true, message: "Informe o sobrenome" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="E-mail"
                    rules={[
                        { required: true, message: "Informe o e-mail" },
                        { type: "email", message: "E-mail inválido" },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="cpf"
                    label="CPF"
                    rules={[{ required: true, message: "Informe o CPF" }]}
                >
                    <Input placeholder="000.000.000-00" maxLength={14} />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Telefone"
                    rules={[{ required: true, message: "Informe o telefone" }]}
                >
                    <Input placeholder="(00) 00000-0000" maxLength={15} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

EditUserModal.propTypes = {
    open: PropTypes.bool.isRequired,
    user: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    setOpen: PropTypes.func.isRequired,
};

export default EditUserModal;
