import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/img/logo";
import Loader from "../components/Loader";

const Login = () => {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(null);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        const success = await login(username, password);
        if (success) {
            navigate("/home");
            setLoading(false);
        } else {
            alert("Login failed. Check your credentials.");
            setLoading(false);
        }
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
                            <button type="submit" className="login-button">
                                Entrar
                            </button>
                        </>
                    )}
                </form>
            </div>
        </>
    );
};

export default Login;
