import { createContext, useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const INACTIVITY_LIMIT = 3600000;
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    let logoutTimer;

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    }, [token]);

    const login = async (username, password) => {
        try {
            const params = new URLSearchParams();
            params.append("username", username);
            params.append("password", password);

            const response = await axios.post(
                `${API_URL}/api/token/`,
                params,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            setToken(response.data.access);
            resetTimer();
            navigate("/dashboard");
            localStorage.setItem("token", response.data.access);
            axios.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${response.data.access}`;

            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        navigate("/login");
    };

    const resetTimer = () => {
        if (logoutTimer) clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            logout();
        }, INACTIVITY_LIMIT);
    };

    useEffect(() => {
        if (token) {
            resetTimer();
            window.addEventListener("mousemove", resetTimer);
            window.addEventListener("keydown", resetTimer);
        }

        return () => {
            window.removeEventListener("mousemove", resetTimer);
            window.removeEventListener("keydown", resetTimer);
        };
    }, [token]);

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
