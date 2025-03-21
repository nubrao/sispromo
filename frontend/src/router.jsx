import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Root } from "./Root";
import LoginForm from "./pages/LoginForm";
import Dashboard from "./pages/Dashboard";
import BrandForm from "./pages/BrandForm";
import StoreForm from "./pages/StoreForm";
import PromoterForm from "./pages/PromoterForm";
import PromoterList from "./pages/PromoterList";
import Visits from "./pages/Visits";
import ResetPassword from "./pages/ResetPassword";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <App />,
                children: [
                    {
                        path: "/",
                        element: <Dashboard />,
                    },
                    {
                        path: "/brands",
                        element: <BrandForm />,
                    },
                    {
                        path: "/stores",
                        element: <StoreForm />,
                    },
                    {
                        path: "/promoters",
                        element: <PromoterList />,
                    },
                    {
                        path: "/promoters/new",
                        element: <PromoterForm />,
                    },
                    {
                        path: "/promoters/:id",
                        element: <PromoterForm />,
                    },
                    {
                        path: "/visits",
                        element: <Visits />,
                    },
                ],
            },
        ],
    },
    {
        path: "/login",
        element: <LoginForm />,
    },
    {
        path: "/reset-password",
        element: <ResetPassword />,
    },
]);

export default router;
