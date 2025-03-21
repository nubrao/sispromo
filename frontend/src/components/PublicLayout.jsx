import { Outlet } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";

const PublicLayout = () => {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
};

export default PublicLayout;
