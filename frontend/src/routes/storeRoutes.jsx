import { lazy } from "react";

const StoreList = lazy(() => import("../pages/StoreList"));
const StoreForm = lazy(() => import("../pages/StoreForm"));

const storeRoutes = [
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
];

export default storeRoutes;
