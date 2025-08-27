import { createContext, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

export const RoleContext = createContext();

const ROLES = {
    MANAGER: 3,
    ANALYST: 2,
    PROMOTER: 1,
};

const ROUTE_ACCESS = {
    "/promoters": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/stores": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/brands": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/promoter-brands": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/visit-prices": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/visits": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/reports": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/users": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
};

export const RoleProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [userProfileId, setUserProfileId] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            setUserRole(user.role);
            setUserProfileId(user.profile?.id || null);
            setLoading(false);
        } else {
            setUserRole(null);
            setUserProfileId(null);
            setLoading(true);
        }
    }, [user]);

    const isManager = userRole === ROLES.MANAGER;
    const isAnalyst = userRole === ROLES.ANALYST;
    const isPromoter = userRole === ROLES.PROMOTER;

    const canAccessRoute = (path) => {
        // Se for a rota raiz (/), permite acesso para todos os usuários autenticados
        if (path === "/") return true;

        const allowedRoles = ROUTE_ACCESS[path];
        return allowedRoles ? allowedRoles.includes(userRole) : false;
    };

    return (
        <RoleContext.Provider
            value={{
                userRole,
                userProfileId,
                loading,
                isManager,
                isAnalyst,
                isPromoter,
                canAccessRoute,
            }}
        >
            {children}
        </RoleContext.Provider>
    );
};

RoleProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error("useRole deve ser usado dentro de um RoleProvider");
    }
    return context;
};
