import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/modal.css";

const EditUserModal = ({ open, user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        cpf: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                username: user.username || "",
                cpf: formatCPF(user.profile.cpf) || "",
                phone: formatPhone(user.profile.phone) || "",
            });
        }
    }, [user]);

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
        setErrors((prev) => ({ ...prev, [name]: "" }));

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Remove as máscaras antes de enviar
            const dataToSend = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, ""),
                phone: formData.phone.replace(/\D/g, ""),
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
        <div className="modal-overlay">
            <div className="modal-content edit-user-modal">
                <h3>Editar Usuário</h3>
                <form onSubmit={handleSubmit} className="edit-user-form">
                    <div className="form-group">
                        <label htmlFor="username">Usuário:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="first_name">Nome:</label>
                        <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="last_name">Sobrenome:</label>
                        <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">E-mail:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="cpf">CPF:</label>
                        <input
                            type="text"
                            id="cpf"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleChange}
                            placeholder="000.000.000-00"
                            maxLength={14}
                            required
                        />
                        {errors.cpf && (
                            <span className="error-message">{errors.cpf}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Telefone:</label>
                        <input
                            type="text"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            required
                        />
                        {errors.phone && (
                            <span className="error-message">
                                {errors.phone}
                            </span>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button
                            type="submit"
                            className="modal-save-button"
                            disabled={loading}
                        >
                            {loading ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="modal-cancel-button"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

EditUserModal.propTypes = {
    open: PropTypes.bool.isRequired,
    user: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
};

export default EditUserModal;
