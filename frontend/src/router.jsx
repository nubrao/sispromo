import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Root } from "./Root";
import LoginForm from "./pages/LoginForm";
import Dashboard from "./pages/Dashboard";
import BrandForm from "./pages/BrandForm";
import BrandList from "./pages/BrandList";
import StoreList from "./pages/StoreList";
import StoreForm from "./pages/StoreForm";
import PromoterForm from "./pages/PromoterForm";
import PromoterList from "./pages/PromoterList";
import ResetPassword from "./pages/ResetPassword";
import VisitsList from "./pages/VisitsList";
import ReportsForm from "./pages/ReportsForm";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/login",
                element: <LoginForm />,
            },
            {
                path: "/reset-password",
                element: <ResetPassword />,
            },
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
                        element: <BrandList />,
                    },
                    {
                        path: "/brands/new",
                        element: <BrandForm />,
                    },
                    {
                        path: "/brands/:id/edit",
                        element: <BrandForm />,
                    },
                    {
                        path: "/stores",
                        element: <StoreList />,
                    },
                    {
                        path: "/stores/new",
                        element: <StoreForm />,
                    },
                    {
                        path: "/stores/:id/edit",
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
                        path: "/promoters/:id/edit",
                        element: <PromoterForm />,
                    },
                    {
                        path: "/visits",
                        element: <VisitsList />,
                    },
                    {
                        path: "/reports",
                        element: <ReportsForm />,
                    },
                ],
            },
        ],
    },
]);

export default router;
