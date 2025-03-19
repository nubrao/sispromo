import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import { formatCPF } from "../hooks/useMask";
import Loader from "../components/Loader";
import { Toast } from "../components/Toast";
import userRepository from "../repositories/userRepository";
import "../styles/login.css";
import Logo from "../assets/img/logo";

const ResetPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const { showToast } = useTranslateMessage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const resetData = {
            email,
        };

        try {
            await userRepository.resetPassword(resetData);
            showToast(
                "Senha resetada com sucesso! Verifique seu email.",
                "success"
            );
            navigate("/login");
        } catch (error) {
            let errorMsg = "Erro ao resetar senha.";

            if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }

            setError(errorMsg);
            showToast(errorMsg, "error");
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
