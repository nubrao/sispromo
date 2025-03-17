import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/promoter-brand.css";
import Loader from "../components/Loader";
import Select from "react-select";
import { RoleContext } from "../context/RoleContext";
import { Navigate } from "react-router-dom";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import { LoadingModal } from "../components/LoadingModal";
import PropTypes from "prop-types";

const PromoterBrandAssignment = ({
    loading,
    setLoading,
    modalOpen,
    setModalOpen,
    success,
    setSuccess,
    errorMessage,
    setErrorMessage,
}) => {
    const [promoters, setPromoters] = useState([]);
    const [brands, setBrands] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedPromoter, setSelectedPromoter] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { isManager, isAnalyst } = useContext(RoleContext);
    const isManagerOrAnalyst = isManager() || isAnalyst();
    const { translateMessage } = useTranslateMessage();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isManagerOrAnalyst) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManagerOrAnalyst]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [promotersRes, brandsRes, assignmentsRes] = await Promise.all(
                [
                    axios.get(`${API_URL}/api/promoters/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${API_URL}/api/brands/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${API_URL}/api/promoter-brands/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]
            );

            setPromoters(
                promotersRes.data.map((promoter) => ({
                    value: promoter.id,
                    label: `${promoter.name} (${
                        promoter.email || "Sem email"
                    })`,
                    name: promoter.name,
                    email: promoter.email,
                }))
            );

            setBrands(
                brandsRes.data.map((brand) => ({
                    value: brand.id,
                    label: `${brand.brand_name} - ${brand.store.name} (${brand.store.number})`,
                }))
            );

            setAssignments(assignmentsRes.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            setError(
                error.response?.data?.error ||
                    "Erro ao carregar dados. Tente novamente."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPromoter || !selectedBrand) {
            setErrorMessage("Por favor, selecione um promotor e uma marca.");
            return;
        }

        setLoading(true);
        setModalOpen(true);
        setSuccess(false);
        setErrorMessage(null);

        try {
            await axios.post(
                `${API_URL}/api/promoter-brands/`,
                {
                    promoter: selectedPromoter.value,
                    brand: selectedBrand.value,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSelectedPromoter(null);
            setSelectedBrand(null);
            fetchData();
        } catch (error) {
            console.error("Erro ao criar atribuição:", error);
            const message = translateMessage(error.response?.data?.error);
            setErrorMessage(message || "Erro ao criar atribuição.");
            setSuccess(false);
        } finally {
            setLoading(false);
            setSuccess(true);
        }
    };

    const handleDelete = async (id) => {
        if (
            !window.confirm("Tem certeza que deseja remover esta atribuição?")
        ) {
            return;
        }

        setLoading(true);
        setModalOpen(true);
        setSuccess(false);
        setErrorMessage(null);

        try {
            await axios.delete(`${API_URL}/api/promoter-brands/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccess(true);
            fetchData();
        } catch (error) {
            console.error("Erro ao excluir atribuição:", error);
            const message = translateMessage(error.response?.data?.error);
            setErrorMessage(message || "Erro ao excluir atribuição.");
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    // Redireciona para home se não for gestor ou analista
    if (!isManagerOrAnalyst) {
        return <Navigate to="/home" />;
    }

    if (loading) {
        return (
            <div className="promoter-brand-container">
                <div className="loading-container">
                    <Loader />
                </div>
            </div>
        );
    }

    return (
        <div className="promoter-brand-container">
            <h2 className="page-title">Atribuição de Marcas</h2>

            <form onSubmit={handleSubmit} className="promoter-brand-form">
                <div className="select-container">
                    <Select
                        value={selectedPromoter}
                        onChange={setSelectedPromoter}
                        options={promoters}
                        placeholder="Selecione um promotor"
                        className="react-select"
                        classNamePrefix="react-select"
                        isClearable
                        isSearchable
                    />
                    <Select
                        value={selectedBrand}
                        onChange={setSelectedBrand}
                        options={brands}
                        placeholder="Selecione uma marca"
                        className="react-select"
                        classNamePrefix="react-select"
                        isClearable
                        isSearchable
                    />
                </div>
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}
                <button type="submit" className="promoter-brand-button">
                    Atribuir Marca
                </button>
            </form>

            <LoadingModal
                open={modalOpen}
                success={success}
                loading={loading}
                errorMessage={errorMessage}
                onClose={() => setModalOpen(false)}
            />

            <div className="assignments-list">
                <h3>Atribuições Atuais</h3>
                {assignments.length === 0 ? (
                    <p className="no-assignments">
                        Nenhuma atribuição encontrada.
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Promotor</th>
                                    <th>Email</th>
                                    <th>Marca</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td>{assignment.promoter_name}</td>
                                        <td>
                                            {assignment.promoter_email || "-"}
                                        </td>
                                        <td>{assignment.brand_name}</td>
                                        <td>
                                            <div className="form-actions">
                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            assignment.id
                                                        )
                                                    }
                                                    className="form-button delete-button"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

PromoterBrandAssignment.propTypes = {
    loading: PropTypes.bool.isRequired,
    setLoading: PropTypes.func.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    success: PropTypes.bool.isRequired,
    setSuccess: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    setErrorMessage: PropTypes.func.isRequired,
};

export default PromoterBrandAssignment;
