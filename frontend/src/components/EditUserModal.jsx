import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/modal.css";
import { Form, Input, Modal } from "antd";

const EditUserModal = ({ open, setOpen, user, onSave }) => {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        cpf: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // Atualiza os valores do formulário quando formData mudar
    useEffect(() => {
        if (open) {
            form.setFieldsValue(formData);
        }
    }, [open, formData, form]);

    useEffect(() => {
        if (user) {
            const formattedData = {
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                username: user.username || "",
                cpf: formatCPF(user.profile.cpf) || "",
                phone: formatPhone(user.profile.phone) || "",
            };

            setFormData(formattedData);
            form.setFieldsValue(formattedData);
        }
    }, [user, form]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === "cpf") {
            formattedValue = value.replace(/\D/g, "");
            if (formattedValue.length <= 11) {
                formattedValue = formattedValue.replace(
                    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
                    "$1.$2.$3-$4"
                );
            }
        } else if (name === "phone") {
            formattedValue = value.replace(/\D/g, "");
            if (formattedValue.length <= 11) {
                formattedValue = formattedValue.replace(
                    /^(\d{2})(\d{5})(\d{4})$/,
                    "($1) $2-$3"
                );
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: formattedValue,
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        const cpfNumbers = formData.cpf.replace(/\D/g, "");
        const phoneNumbers = formData.phone.replace(/\D/g, "");

        if (!validateCPF(cpfNumbers)) {
            newErrors.cpf = "CPF inválido";
        }

        if (phoneNumbers.length !== 11) {
            newErrors.phone = "Telefone deve ter 11 dígitos";
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (values) => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const dataToSend = {
                ...values,
                cpf: values.cpf.replace(/\D/g, ""),
                phone: values.phone.replace(/\D/g, ""),
            };
            await onSave(dataToSend);
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Modal
            title="Editar Usuário"
            open={open}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpen(false);
                form.resetFields();
            }}
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
        >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
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
                    <Input
                        placeholder="000.000.000-00"
                        maxLength={11}
                        value={formData.cpf}
                        onChange={handleChange}
                        name="cpf"
                    />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Telefone"
                    rules={[{ required: true, message: "Informe o telefone" }]}
                >
                    <Input
                        placeholder="(00) 00000-0000"
                        maxLength={11}
                        value={formData.phone}
                        onChange={handleChange}
                        name="phone"
                    />
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
