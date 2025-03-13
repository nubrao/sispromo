import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/img/logo";
import Loader from "../components/Loader";

const Login = () => {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const success = await login(username, password);
        if (success) {
            navigate("/home");
        } else {
            setError(
                "Usuário ou senha incorretos. Por favor, tente novamente."
            );
        }
        setLoading(false);
    };

    return (
        <>
            <span className="welcome">Bem-vindo ao SisPromo</span>
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
                                placeholder="Usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="login-input"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                                required
                            />
                            {error && (
                                <div className="error-message">{error}</div>
                            )}
                            <button type="submit" className="login-button">
                                Entrar
                            </button>
                            <div className="auth-links">
                                <Link to="/register" className="auth-link">
                                    Ainda não tem uma conta? Cadastre-se aqui
                                </Link>
                                <Link
                                    to="/reset-password"
                                    className="auth-link"
                                >
                                    Esqueceu sua senha?
                                </Link>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </>
    );
};

export default Login;
