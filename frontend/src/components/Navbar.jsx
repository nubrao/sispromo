import { useContext, useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../contexts/AuthContext";
import { RoleContext } from "../contexts/RoleContext";
import "../styles/navbar.css";
import Hamburger from "./../assets/svg/Hamburger";
import { Button, Menu } from "antd";
import {
    LogoutOutlined,
    DashboardOutlined,
    TeamOutlined,
    ShopOutlined,
    TagsOutlined,
    ScheduleOutlined,
    BarChartOutlined,
    UserAddOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";

const Navbar = () => {
    const { t } = useTranslation(["common", "auth"]);
    const { logout } = useContext(AuthContext);
    const { isManager, loading } = useContext(RoleContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const handleMenuClick = (path) => {
        navigate(path);
        if (isMobile) {
            closeSidebar();
        }
    };

    const menuItems = useMemo(
        () => [
            {
                key: "dashboard",
                label: t("common:menu.dashboard"),
                icon: <DashboardOutlined />,
                onClick: () => handleMenuClick("/"),
            },
            {
                key: "promoters",
                label: t("common:menu.promoters"),
                icon: <TeamOutlined />,
                children: [
                    {
                        key: "promoters-new",
                        label: t("common:menu.promoters_new"),
                        icon: <UserAddOutlined />,
                        onClick: () => handleMenuClick("/promoters/new"),
                    },
                    {
                        key: "promoters-list",
                        label: t("common:menu.promoters_list"),
                        icon: <UnorderedListOutlined />,
                        onClick: () => handleMenuClick("/promoters"),
                    },
                ],
            },
            {
                key: "brands",
                label: t("common:menu.brands"),
                icon: <TagsOutlined />,
                onClick: () => handleMenuClick("/brands"),
            },
            {
                key: "stores",
                label: t("common:menu.stores"),
                icon: <ShopOutlined />,
                onClick: () => handleMenuClick("/stores"),
            },
            {
                key: "visits",
                label: t("common:menu.visits"),
                icon: <ScheduleOutlined />,
                onClick: () => handleMenuClick("/visits"),
            },
            {
                key: "reports",
                label: t("common:menu.reports"),
                icon: <BarChartOutlined />,
                onClick: () => handleMenuClick("/reports"),
            },
        ],
        [t]
    );

    if (loading) {
        return <div className="navbar">Carregando...</div>;
    }

    const currentPath =
        location.pathname === "/"
            ? "dashboard"
            : location.pathname.split("/")[1];

    return (
        <>
            <div className="navbar">
                {isMobile ? (
                    <>
                        <Hamburger
                            className="hamburger"
                            onClick={toggleSidebar}
                        />
                        <span className="navbar-title">SisPromo</span>
                    </>
                ) : (
                    <>
                        <div className="navbar-brand">
                            <Link to="/">
                                <h1>{t("common:appName")}</h1>
                            </Link>
                        </div>
                        <nav className="navbar-links">
                            <Menu
                                mode="horizontal"
                                selectedKeys={[currentPath]}
                                items={menuItems}
                                className="nav-menu"
                            />
                        </nav>
                        <Button
                            type="primary"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            className="logout-button"
                        >
                            {t("auth:logout")}
                        </Button>
                    </>
                )}
            </div>

            {isMobile && (
                <>
                    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                        <button
                            className="close-sidebar"
                            onClick={closeSidebar}
                        >
                            ✖
                        </button>
                        <nav className="sidebar-links">
                            <Menu
                                mode="inline"
                                selectedKeys={[currentPath]}
                                items={menuItems}
                                className="nav-menu"
                            />
                            <Button
                                type="primary"
                                danger
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                className="logout-button"
                            >
                                {t("auth:logout")}
                            </Button>
                        </nav>
                    </div>

                    {sidebarOpen && (
                        <div className="overlay" onClick={closeSidebar}></div>
                    )}
                </>
            )}
        </>
    );
};

export default Navbar;
