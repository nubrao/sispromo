import { useContext } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Layout } from "antd";
import { AuthContext } from "./contexts/AuthContext";
import { RoleProvider } from "./contexts/RoleContext";
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";
import "./styles/app.css";

const { Content } = Layout;

function App() {
    const { signed, loading: authLoading } = useContext(AuthContext);
    const location = useLocation();
    const isPublicRoute =
        location.pathname === "/login" ||
        location.pathname === "/reset-password";

    if (authLoading) {
        return <Loader size="fullscreen" text="Carregando..." />;
    }

    // Se não estiver autenticado e não for uma rota pública, redireciona para login
    if (!signed && !isPublicRoute) {
        return <Navigate to="/login" replace />;
    }

    // Se estiver autenticado e tentar acessar uma rota pública, redireciona para dashboard
    if (signed && isPublicRoute) {
        return <Navigate to="/" replace />;
    }

    return (
        <RoleProvider>
            <Layout className="app-layout">
                {signed && !isPublicRoute && <Navbar />}
                <Content
                    className={`app-content ${
                        isPublicRoute ? "login-page" : ""
                    }`}
                >
                    <Outlet />
                </Content>
            </Layout>
        </RoleProvider>
    );
}

export default App;
