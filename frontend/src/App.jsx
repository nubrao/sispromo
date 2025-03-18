import { useContext, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { RoleContext, RoleProvider } from "./context/RoleContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import PromoterForm from "./pages/PromoterForm";
import StoreForm from "./pages/StoreForm";
import Visits from "./pages/Visits";
import Navbar from "./components/Navbar";
import PropTypes from "prop-types";
import BrandForm from "./pages/BrandForm";
import Reports from "./pages/ReportsForm";
import VisitPriceForm from "./pages/VisitPriceForm";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import PromoterBrandAssignment from "./pages/PromoterBrandAssignment";

const PrivateRoute = ({ children }) => {
    const { token } = useContext(AuthContext);
    const { canAccessRoute, loading } = useContext(RoleContext);
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!canAccessRoute(location.pathname)) {
        return <Navigate to="/home" />;
    }

    return children;
};

PrivateRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

function App() {
    const { token } = useContext(AuthContext);
    const location = useLocation();
    const [loading, setLoading] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [dataLoaded, setDataLoaded] = useState(false);

    return (
        <RoleProvider>
            <div
                className={`app-container ${
                    location.pathname === "/login" ? "login" : ""
                }`}
            >
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
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/reset-password"
                            element={<ResetPassword />}
                        />
                        <Route
                            path="/home"
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
                                    <PromoterForm
                                        loading={loading}
                                        setLoading={setLoading}
                                        modalOpen={modalOpen}
                                        setModalOpen={setModalOpen}
                                        success={success}
                                        setSuccess={setSuccess}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        dataLoaded={dataLoaded}
                                        setDataLoaded={setDataLoaded}
                                    />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/stores"
                            element={
                                <PrivateRoute>
                                    <StoreForm
                                        loading={loading}
                                        setLoading={setLoading}
                                        modalOpen={modalOpen}
                                        setModalOpen={setModalOpen}
                                        success={success}
                                        setSuccess={setSuccess}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        dataLoaded={dataLoaded}
                                        setDataLoaded={setDataLoaded}
                                    />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/brands"
                            element={
                                <PrivateRoute>
                                    <BrandForm
                                        loading={loading}
                                        setLoading={setLoading}
                                        modalOpen={modalOpen}
                                        setModalOpen={setModalOpen}
                                        success={success}
                                        setSuccess={setSuccess}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        dataLoaded={dataLoaded}
                                        setDataLoaded={setDataLoaded}
                                    />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/promoter-brands"
                            element={
                                <PrivateRoute>
                                    <PromoterBrandAssignment
                                        loading={loading}
                                        setLoading={setLoading}
                                        modalOpen={modalOpen}
                                        setModalOpen={setModalOpen}
                                        success={success}
                                        setSuccess={setSuccess}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        dataLoaded={dataLoaded}
                                        setDataLoaded={setDataLoaded}
                                    />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/visit-prices"
                            element={
                                <PrivateRoute>
                                    <VisitPriceForm
                                        loading={loading}
                                        setLoading={setLoading}
                                        modalOpen={modalOpen}
                                        setModalOpen={setModalOpen}
                                        success={success}
                                        setSuccess={setSuccess}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        dataLoaded={dataLoaded}
                                        setDataLoaded={setDataLoaded}
                                    />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/visits"
                            element={
                                <PrivateRoute>
                                    <Visits
                                        loading={loading}
                                        setLoading={setLoading}
                                        modalOpen={modalOpen}
                                        setModalOpen={setModalOpen}
                                        success={success}
                                        setSuccess={setSuccess}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        dataLoaded={dataLoaded}
                                        setDataLoaded={setDataLoaded}
                                    />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <PrivateRoute>
                                    <Reports
                                        loading={loading}
                                        setLoading={setLoading}
                                        modalOpen={modalOpen}
                                        setModalOpen={setModalOpen}
                                        success={success}
                                        setSuccess={setSuccess}
                                        errorMessage={errorMessage}
                                        setErrorMessage={setErrorMessage}
                                        dataLoaded={dataLoaded}
                                        setDataLoaded={setDataLoaded}
                                    />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <PrivateRoute>
                                    <UserManagement />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </RoleProvider>
    );
}

export default App;
