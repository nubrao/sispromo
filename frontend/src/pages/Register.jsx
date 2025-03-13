import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";
import Logo from "../assets/img/logo";
import Loader from "../components/Loader";

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
        cpf: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const handleChange = (e) => {
        let value = e.target.value;
        const name = e.target.name;

        // Formatação do CPF
        if (name === "cpf") {
            value = value.replace(/\D/g, ""); // Remove não dígitos
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            value = value.substring(0, 14);
        }

        // Formatação do telefone
        if (name === "phone") {
            value = value.replace(/\D/g, ""); // Remove não dígitos
            if (value.length > 11) value = value.substring(0, 11);
            if (value.length > 7) {
                if (value.length > 10) {
                    value = value.replace(
                        /^(\d{2})(\d{5})(\d{4}).*/,
                        "($1) $2-$3"
                    );
                } else {
                    value = value.replace(
                        /^(\d{2})(\d{4})(\d{0,4}).*/,
                        "($1) $2-$3"
                    );
                }
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
            } else if (value.length > 0) {
                value = value.replace(/^(\d*)/, "($1");
            }
        }

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (formData.password !== formData.password_confirm) {
            setError("As senhas não coincidem");
            setLoading(false);
            return;
        }

        // Validação do CPF (formato básico)
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        if (!cpfRegex.test(formData.cpf)) {
            setError("CPF inválido");
            setLoading(false);
            return;
        }

        // Validação do telefone (formato básico)
        const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError("Telefone inválido");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/api/users/register/`,
                {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    password_confirm: formData.password_confirm,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    role: "promoter", // Papel padrão para novos usuários
                }
            );

            if (response.status === 201) {
                alert(
                    "Cadastro realizado com sucesso! Você já pode fazer login."
                );
                navigate("/login");
            }
        } catch (error) {
            if (error.response?.data?.error) {
                setError(error.response.data.error);
            } else if (error.response?.data) {
                // Se houver erros de validação específicos
                const errors = Object.values(error.response.data).flat();
                setError(errors[0]); // Mostra o primeiro erro
            } else {
                setError("Erro ao criar conta. Por favor, tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <span className="welcome">Criar Conta no SisPromo</span>
            <div className="login-container">
                <Logo />
                <form onSubmit={handleSubmit} className="login-form">
                    {loading ? (
                        <div className="loading-container">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                name="first_name"
                                placeholder="Nome"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            <input
                                type="text"
                                name="last_name"
                                placeholder="Sobrenome"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            <input
                                type="text"
                                name="cpf"
                                placeholder="CPF (000.000.000-00)"
                                value={formData.cpf}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            <input
                                type="text"
                                name="phone"
                                placeholder="Telefone ((00) 00000-0000)"
                                value={formData.phone}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            <input
                                type="text"
                                name="username"
                                placeholder="Nome de Usuário"
                                value={formData.username}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="E-mail"
                                value={formData.email}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Senha"
                                value={formData.password}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            <input
                                type="password"
                                name="password_confirm"
                                placeholder="Confirmar Senha"
                                value={formData.password_confirm}
                                onChange={handleChange}
                                className="login-input"
                                required
                            />
                            {error && (
                                <div className="error-message">{error}</div>
                            )}
                            <button type="submit" className="login-button">
                                Criar Conta
                            </button>
                            <Link to="/login" className="auth-link">
                                Já tem uma conta? Faça login
                            </Link>
                        </>
                    )}
                </form>
            </div>
        </>
    );
};

export default Register;
