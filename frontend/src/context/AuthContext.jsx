import { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import userRepository from "../repositories/userRepository";

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

    const fetchUserData = async () => {
        try {
            const userData = await userRepository.getCurrentUser();
            setUser(userData);
            return userData;
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            return null;
        }
    };

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

                    // Busca os dados do usuário após verificar o token
                    await fetchUserData();
                }
            } catch (error) {
                console.error("Token inválido ou expirado", error);
                logout();
            }
        };

        verifyToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                // Rotas que não devem causar logout automático em caso de 401
                const publicRoutes = [
                    `${API_URL}/api/users/`, // rota de registro
                    `${API_URL}/api/reset-password/`, // rota de reset de senha
                ];

                // Verificamos se o erro é 401 e se não é uma das rotas públicas
                if (
                    error.response?.status === 401 &&
                    error.config?.url &&
                    !publicRoutes.some((route) =>
                        error.config.url.startsWith(route)
                    )
                ) {
                    console.error("Sessão expirada. Deslogando usuário...");
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            // Busca os dados do usuário após o login
            const userData = await fetchUserData();
            if (!userData) {
                throw new Error("Não foi possível obter os dados do usuário");
            }

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
