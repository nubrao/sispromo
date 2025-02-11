import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import PropTypes from "prop-types"; // 🔹 Importando PropTypes
import "../styles/navbar.css";

const Navbar = ({ isOpen, setIsOpen }) => {
    const { logout } = useContext(AuthContext);

    return (
        <div className={`navbar ${isOpen ? "open" : "closed"}`}>
            <div className="navbar-header">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="menu-button"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <h2 className={`navbar-title ${isOpen ? "visible" : "hidden"}`}>
                    Páginas
                </h2>
            </div>

            <nav className={`navbar-links ${isOpen ? "visible" : "hidden"}`}>
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
                        <Link to="/visits">Visitas</Link>
                    </li>
                </ul>
            </nav>

            <div className={`navbar-footer ${isOpen ? "visible" : "hidden"}`}>
                <button onClick={logout} className="logout-button">
                    Logout
                </button>
            </div>
        </div>
    );
};

// 🔹 Adicionando validação de props para evitar erros
Navbar.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setIsOpen: PropTypes.func.isRequired,
};

export default Navbar;
