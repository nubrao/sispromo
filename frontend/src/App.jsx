import { useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import PromoterForm from "./pages/PromoterForm";
import StoreForm from "./pages/StoreForm";
import VisitForm from "./pages/VisitForm";
import Navbar from "./components/Navbar";
import PropTypes from "prop-types";
import BrandForm from "./pages/BrandForm";

const PrivateRoute = ({ children }) => {
    const authContext = useContext(AuthContext);
    return authContext.token ? children : <Navigate to="/login" />;
};

PrivateRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

function App() {
    const { token } = useContext(AuthContext);
    const location = useLocation();

    return (
        <div className="app-container">
            {token && <Navbar />}
            <div
                className={`content ${
                    location.pathname === "/login" ? "login" : ""
                }`}
            >
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Navigate
                                to={token ? "/home" : "/login"}
                                replace
                            />
                        }
                    />

                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/home"
                        element={
                            <PrivateRoute>
                                <Home />
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
                        path="/brands"
                        element={
                            <PrivateRoute>
                                <BrandForm />
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

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;
