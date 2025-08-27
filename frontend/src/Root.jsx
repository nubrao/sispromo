import { AuthProvider } from "./contexts/AuthContext";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";

export function Root() {
    return (
        <ConfigProvider locale={ptBR}>
            <AuthProvider>
                <Outlet />
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
            </AuthProvider>
        </ConfigProvider>
    );
}
