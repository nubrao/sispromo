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
                let newToken = token;

                if (refreshToken) {
                    const response = await axios.post(
                        `${API_URL}/api/token/refresh/`,
                        { refresh: refreshToken }
                    );
                    newToken = response.data.access;
                    localStorage.setItem("token", newToken);
                } else {
                    await axios.get(`${API_URL}/api/user/`);
                }

                if (newToken !== token) {
                    setToken(newToken);
                    axios.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${newToken}`;
                }
            } catch (error) {
                console.error("Token inválido ou expirado", error);
                logout();
            }
        };

        verifyToken();
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
            navigate("/dashboard");

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
