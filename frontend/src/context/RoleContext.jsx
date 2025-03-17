import { createContext, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [userProfileId, setUserProfileId] = useState(null);
    const [promoterId, setPromoterId] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!token) {
                setUserRole(null);
                setUserProfileId(null);
                setPromoterId(null);
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/api/users/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Armazena os dados do usuário
                const userData = response.data;

                setUserRole(userData.current_role || null);
                setUserProfileId(userData.userprofile_id || null);
                setPromoterId(userData.promoter_id || null);
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                if (error.response) {
                    console.error("Dados do erro:", error.response.data);
                }
                setUserRole(null);
                setUserProfileId(null);
                setPromoterId(null);
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

        if (isManagerUser || isAnalystUser) {
            const managerAnalystRoutes = [
                "/home",
                "/promoters",
                "/stores",
                "/brands",
                "/visit-prices",
                "/visits",
                "/reports",
                "/promoter-brands",
            ];
            if (isManagerUser) {
                managerAnalystRoutes.push("/users");
            }
            return managerAnalystRoutes.includes(route);
        }
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
                userProfileId,
                promoterId,
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
