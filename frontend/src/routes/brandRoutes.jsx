import { lazy } from "react";

const BrandList = lazy(() => import("../pages/BrandList"));
const BrandForm = lazy(() => import("../pages/BrandForm"));

const brandRoutes = [
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
];

export default brandRoutes;
