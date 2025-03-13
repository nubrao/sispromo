import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";
import Logo from "../assets/img/logo";
import Loader from "../components/Loader";

const ResetPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/users/reset-password/`,
                {
                    email,
                }
            );

            if (response.status === 200) {
                setSuccess(true);
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Erro ao solicitar redefinição de senha. Por favor, tente novamente."
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <span className="welcome">Redefinição de Senha</span>
                <div className="login-container">
                    <Logo />
                    <div className="success-message">
                        <p>
                            Um e-mail com instruções para redefinir sua senha
                            foi enviado para {email}.
                        </p>
                        <Link to="/login" className="auth-link">
                            Voltar para o Login
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <span className="welcome">Redefinir Senha</span>
            <div className="login-container">
                <Logo />
                <form onSubmit={handleSubmit} className="login-form">
                    {loading ? (
                        <div className="loading-container">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <p className="reset-instructions">
                                Digite seu e-mail cadastrado para receber as
                                instruções de redefinição de senha.
                            </p>
                            <input
                                type="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="login-input"
                                required
                            />
                            {error && (
                                <div className="error-message">{error}</div>
                            )}
                            <button type="submit" className="login-button">
                                Enviar
                            </button>
                            <Link to="/login" className="auth-link">
                                Voltar para o Login
                            </Link>
                        </>
                    )}
                </form>
            </div>
        </>
    );
};

export default ResetPassword;
