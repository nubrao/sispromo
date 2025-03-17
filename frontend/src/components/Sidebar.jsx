import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/sidebar.css";

const Sidebar = () => {
    const location = useLocation();
    const { user } = useAuth();

    const isManager = user?.role === "manager";
    const isAnalyst = user?.role === "analyst";
    const isManagerOrAnalyst = isManager || isAnalyst;

    return (
        <div className="sidebar">
            <nav>
                <ul>
                    <li>
                        <Link
                            to="/"
                            className={
                                location.pathname === "/" ? "active" : ""
                            }
                        >
                            Dashboard
                        </Link>
                    </li>
                    {isManagerOrAnalyst && (
                        <>
                            <li>
                                <Link
                                    to="/stores"
                                    className={
                                        location.pathname === "/stores"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    Lojas
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/brands"
                                    className={
                                        location.pathname === "/brands"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    Marcas
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/promoter-brands"
                                    className={
                                        location.pathname === "/promoter-brands"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    Atribuir Marcas
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/promoters"
                                    className={
                                        location.pathname === "/promoters"
                                            ? "active"
                                            : ""
                                    }
                                >
                                    Promotores
                                </Link>
                            </li>
                        </>
                    )}
                    <li>
                        <Link
                            to="/visits"
                            className={
                                location.pathname === "/visits" ? "active" : ""
                            }
                        >
                            Visitas
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
