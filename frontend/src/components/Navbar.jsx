import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/navbar.css";
import Hamburger from './../assets/svg/Hamburger';

const Navbar = () => {
    const { logout } = useContext(AuthContext);
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
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            <div className="navbar">
                <Hamburger className="hamburger" onClick={toggleSidebar} />

                {isMobile && <span className="navbar-title">SisPromo</span>}

                <nav className="navbar-links">
                    <ul>
                        <li>
                            <Link to="/home">Início</Link>
                        </li>
                        <li>
                            <Link to="/promoters">Promotores</Link>
                        </li>
                        <li>
                            <Link to="/stores">Lojas</Link>
                        </li>
                        <li>
                            <Link to="/brands">Marcas</Link>
                        </li>
                        <li>
                            <Link to="/visit-prices">Preços das Visitas</Link>
                        </li>
                        <li>
                            <Link to="/visits">Visitas</Link>
                        </li>
                        <li>
                            <Link to="/reports">Relatórios</Link>
                        </li>
                    </ul>
                </nav>

                <button onClick={logout} className="logout-button">
                    Sair
                </button>
            </div>

            <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                <button className="close-sidebar" onClick={closeSidebar}>
                    ✖
                </button>
                <nav className="sidebar-links">
                    <ul>
                        <li>
                            <Link to="/home">Início</Link>
                        </li>
                        <li>
                            <Link to="/promoters">Promotores</Link>
                        </li>
                        <li>
                            <Link to="/stores">Lojas</Link>
                        </li>
                        <li>
                            <Link to="/brands">Marcas</Link>
                        </li>
                        <li>
                            <Link to="/visit-prices">Preços das Visitas</Link>
                        </li>
                        <li>
                            <Link to="/visits">Visitas</Link>
                        </li>
                        <li>
                            <Link to="/reports">Relatórios</Link>
                        </li>
                    </ul>
                </nav>
            </div>

            {sidebarOpen && (
                <div className="overlay" onClick={closeSidebar}></div>
            )}
        </>
    );
};

export default Navbar;
