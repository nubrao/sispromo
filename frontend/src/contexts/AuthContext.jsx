import {
    createContext,
    useState,
    useContext,
    useEffect,
    useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { Toast } from "../components/Toast";
import PropTypes from "prop-types";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useTranslation(["auth", "errors"]);

    const loadStoredData = useCallback(async () => {
        const storedToken = localStorage.getItem("@SisPromo:token");

        if (storedToken) {
            api.defaults.headers.authorization = `Bearer ${storedToken}`;
            try {
                const response = await api.get("/api/users/me/");
                setUser(response.data);
            } catch (error) {
                console.error("Erro ao carregar usuário:", error);
                localStorage.removeItem("@SisPromo:token");
                localStorage.removeItem("@SisPromo:refresh");
                api.defaults.headers.authorization = "";
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadStoredData();
    }, [loadStoredData]);

    const login = async (username, password) => {
        setLoading(true);
        try {
            // Obtém o token JWT
            const tokenResponse = await api.post("/api/token/", {
                username,
                password,
            });

            const { access, refresh } = tokenResponse.data;

            // Configura o token no header das requisições
            api.defaults.headers.authorization = `Bearer ${access}`;

            // Obtém os dados do usuário
            const userResponse = await api.get("/api/users/me/");
            const userData = userResponse.data;

            // Salva os dados no localStorage
            localStorage.setItem("@SisPromo:token", access);
            localStorage.setItem("@SisPromo:refresh", refresh);

            // Atualiza o estado
            setUser(userData);

            Toast.success(t("auth:messages.success.login"));

            // Navega para a página inicial após atualizar o estado
            setTimeout(() => {
                navigate("/");
            }, 100);

            return true;
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            const errorMessage =
                error.response?.data?.detail ||
                t("errors:auth.login.messages.error.default");
            Toast.error(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            const refresh = localStorage.getItem("@SisPromo:refresh");
            if (refresh) {
                await api.post("/api/logout/", { refresh_token: refresh });
            }
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        } finally {
            localStorage.removeItem("@SisPromo:token");
            localStorage.removeItem("@SisPromo:refresh");
            api.defaults.headers.authorization = "";
            setUser(null);
            setLoading(false);
            navigate("/login");
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    const refreshToken = async () => {
        try {
            const refresh = localStorage.getItem("@SisPromo:refresh");
            if (!refresh) {
                throw new Error("No refresh token available");
            }

            const response = await api.post("/api/token/refresh/", {
                refresh,
            });

            const { access } = response.data;
            localStorage.setItem("@SisPromo:token", access);
            api.defaults.headers.authorization = `Bearer ${access}`;

            return access;
        } catch (error) {
            console.error("Erro ao renovar token:", error);
            logout();
            return null;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                signed: !!user,
                user,
                loading,
                login,
                logout,
                updateUser,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
};
