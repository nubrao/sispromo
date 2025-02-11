import { useContext, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PromoterForm from "./pages/PromoterForm";
import StoreForm from "./pages/StoreForm";
import VisitForm from "./pages/VisitForm";
import Navbar from "./components/Navbar";
import PropTypes from "prop-types";

const PrivateRoute = ({ children }) => {
    const authContext = useContext(AuthContext);
    return authContext.token ? children : <Navigate to="/login" />;
};

PrivateRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

function App() {
    const { token } = useContext(AuthContext);
    const [isNavbarOpen, setIsNavbarOpen] = useState(true); // 🔹 Estado único para a navbar

    return (
        <div className="app-container">
            {token && (
                <Navbar isOpen={isNavbarOpen} setIsOpen={setIsNavbarOpen} />
            )}
            <div
                className={`content ${
                    isNavbarOpen ? "with-navbar" : "full-width"
                }`}
            >
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/promoters"
                        element={
                            <PrivateRoute>
                                <PromoterForm />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/stores"
                        element={
                            <PrivateRoute>
                                <StoreForm />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/visits"
                        element={
                            <PrivateRoute>
                                <VisitForm />
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;
