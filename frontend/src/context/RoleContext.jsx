import { createContext, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

export const RoleContext = createContext();

const ROLES = {
    MANAGER: "manager",
    ANALYST: "analyst",
    PROMOTER: "promoter",
};

const ROUTE_ACCESS = {
    "/home": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/promoters": [ROLES.MANAGER, ROLES.ANALYST],
    "/stores": [ROLES.MANAGER, ROLES.ANALYST],
    "/brands": [ROLES.MANAGER, ROLES.ANALYST],
    "/promoter-brands": [ROLES.MANAGER, ROLES.ANALYST],
    "/visit-prices": [ROLES.MANAGER, ROLES.ANALYST],
    "/visits": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/reports": [ROLES.MANAGER, ROLES.ANALYST, ROLES.PROMOTER],
    "/users": [ROLES.MANAGER],
};

export const RoleProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            setUserRole(user.current_role);
            setLoading(false);
        } else {
            setUserRole(null);
            setLoading(true);
        }
    }, [user]);

    const isManager = userRole === ROLES.MANAGER;
    const isAnalyst = userRole === ROLES.ANALYST;
    const isPromoter = userRole === ROLES.PROMOTER;

    const canAccessRoute = (path) => {
        const allowedRoles = ROUTE_ACCESS[path];
        return allowedRoles ? allowedRoles.includes(userRole) : false;
    };

    return (
        <RoleContext.Provider
            value={{
                userRole,
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
