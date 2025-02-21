import { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [refreshToken, setRefreshToken] = useState(
        localStorage.getItem("refreshToken") || null
    );
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const hasCheckedToken = useRef(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                logout();
                return;
            }

            if (hasCheckedToken.current) return;
            hasCheckedToken.current = true;

            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            try {
                if (refreshToken) {
                    const response = await axios.post(
                        `${API_URL}/api/token/refresh/`,
                        { refresh: refreshToken }
                    );
                    setToken(response.data.access);
                    localStorage.setItem("token", response.data.access);
                    axios.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${response.data.access}`;
                }
            } catch (error) {
                console.error("Token inválido ou expirado", error);
                logout();
            }
        };

        verifyToken();
    }, []);

    // Intercepta respostas do Axios para capturar token expirado (401)
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    console.error("Sessão expirada. Deslogando usuário...");
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = async (username, password) => {
        try {
            const params = new URLSearchParams();
            params.append("username", username);
            params.append("password", password);

            const response = await axios.post(`${API_URL}/api/token/`, params, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            setToken(response.data.access);
            setRefreshToken(response.data.refresh);
            localStorage.setItem("token", response.data.access);
            localStorage.setItem("refreshToken", response.data.refresh);

            axios.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${response.data.access}`;
            navigate("/home");

            return true;
        } catch (error) {
            console.error("Falha no login", error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        delete axios.defaults.headers.common["Authorization"];
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AuthProvider;
