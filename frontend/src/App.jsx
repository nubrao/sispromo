import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
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

    return (
        <div className="app-container">
            {token && <Navbar />}
            <div className="content">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Navigate
                                to={token ? "/dashboard" : "/login"}
                                replace
                            />
                        }
                    />

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
