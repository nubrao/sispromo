import { createContext, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!token) {
                setUserRole(null);
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/api/users/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const role = response.data?.profile?.role;
                setUserRole(role || null);
            } catch (error) {
                console.error("Erro ao buscar papel do usuário:", error);
                if (error.response) {
                    console.error("Dados do erro:", error.response.data);
                }
                setUserRole(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRole();
    }, [token, API_URL]);

    const isManager = () => {
        const result = userRole === "manager";
        return result;
    };

    const isAnalyst = () => {
        const result = userRole === "analyst";
        return result;
    };

    const isPromoter = () => {
        const result = userRole === "promoter";
        return result;
    };

    const canAccessRoute = (route) => {
        if (loading) return false;

        const isManagerUser = isManager();
        const isAnalystUser = isAnalyst();
        const isPromoterUser = isPromoter();

        if (isManagerUser || isAnalystUser) return true;
        if (isPromoterUser) {
            const promoterRoutes = ["/home", "/visits", "/reports"];
            const hasAccess = promoterRoutes.includes(route);
            return hasAccess;
        }
        return false;
    };

    return (
        <RoleContext.Provider
            value={{
                userRole,
                isManager,
                isAnalyst,
                isPromoter,
                canAccessRoute,
                loading,
            }}
        >
            {children}
        </RoleContext.Provider>
    );
};

RoleProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
