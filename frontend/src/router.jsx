import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BrandForm from "./pages/BrandForm";
import StoreForm from "./pages/StoreForm";
import PromoterForm from "./pages/PromoterForm";
import VisitForm from "./pages/VisitForm";
import PromoterBrandAssignment from "./pages/PromoterBrandAssignment";

const router = createBrowserRouter([
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
                element: <PromoterForm />,
            },
            {
                path: "/visits",
                element: <VisitForm />,
            },
            {
                path: "/promoter-brands",
                element: <PromoterBrandAssignment />,
            },
        ],
    },
    {
        path: "/login",
        element: <Login />,
    },
]);

export default router;
