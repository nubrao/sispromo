import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { RoleContext } from "../context/RoleContext";
import "../styles/navbar.css";
import Hamburger from "./../assets/svg/Hamburger";

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const { isManager, isAnalyst, loading, userRole } = useContext(RoleContext);
    const location = useLocation();
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

    const isActive = (path) => {
        return location.pathname === path;
    };

    const renderNavLinks = () => {
        const links = [
            {
                path: "/home",
                label: "Dashboard",
                visible: true,
            },
            {
                path: "/promoters",
                label: "Promotores",
                visible: isManager || isAnalyst,
            },
            {
                path: "/stores",
                label: "Lojas",
                visible: isManager || isAnalyst,
            },
            {
                path: "/brands",
                label: "Marcas",
                visible: isManager || isAnalyst,
            },
            {
                path: "/promoter-brands",
                label: "Atribuir Marcas",
                visible: isManager || isAnalyst,
            },
            {
                path: "/visit-prices",
                label: "Preços",
                visible: isManager || isAnalyst,
            },
            {
                path: "/visits",
                label: "Visitas",
                visible: true,
            },
            {
                path: "/reports",
                label: "Relatórios",
                visible: true,
            },
            {
                path: "/users",
                label: "Usuários",
                visible: isManager,
            },
        ];

        const visibleLinks = links.filter((link) => {
            const isVisible = link.visible;

            return isVisible;
        });

        return visibleLinks.map((link) => (
            <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? "active" : ""}`}
                onClick={isMobile ? closeSidebar : undefined}
            >
                {link.label}
            </Link>
        ));
    };

    if (loading) {
        return <div className="navbar">Carregando...</div>;
    }

    return (
        <>
            <div className="navbar">
                {isMobile && (
                    <Hamburger className="hamburger" onClick={toggleSidebar} />
                )}

                {isMobile ? (
                    <span className="navbar-title">SisPromo</span>
                ) : (
                    <nav className="navbar-links">
                        <div className="nav-links">{renderNavLinks()}</div>
                    </nav>
                )}

                <button onClick={logout} className="logout-button">
                    Sair
                </button>
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
                            <div className="nav-links">{renderNavLinks()}</div>
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
