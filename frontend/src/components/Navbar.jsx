import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/navbar.css";

const Navbar = () => {
    const { logout } = useContext(AuthContext);

    return (
        <div className="navbar">
            <nav className="navbar-links">
                <ul>
                    <li>
                        <Link to="/dashboard">Início</Link>
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
                        <Link to="/visits">Visitas</Link>
                    </li>
                </ul>
            </nav>
            <button onClick={logout} className="logout-button">
                Sair
            </button>
        </div>
    );
};

export default Navbar;
