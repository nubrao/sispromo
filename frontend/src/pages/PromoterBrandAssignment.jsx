import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/promoter-brand.css";
import Loader from "../components/Loader";
import Select from "react-select";
import { RoleContext } from "../context/RoleContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import { CustomModal } from "../components/CustomModal";
import PropTypes from "prop-types";
import { formatCPF, formatPhone } from "../hooks/useMask";
import Toast from "../components/Toast";
import promoterRepository from "../repositories/promoterRepository";

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
    const isManagerOrAnalyst = isManager || isAnalyst;
    const { translateMessage } = useTranslateMessage();
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { showToast } = Toast;

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

            // Formata os promotores para o select
            const promoterOptions = promotersRes.data.map((promoter) => ({
                value: promoter.id,
                label: promoter.user_profile?.user
                    ? `${promoter.user_profile.user.first_name} ${
                          promoter.user_profile.user.last_name
                      } (${promoter.user_profile.user.email || "Sem email"})`
                    : `${promoter.name} (${promoter.cpf})`,
                name: promoter.name,
                email: promoter.user_profile?.user?.email,
            }));
            setPromoters(promoterOptions);

            // Formata as marcas para o select
            const brandOptions = brandsRes.data.map((brand) => ({
                value: brand.id,
                label: `${brand.brand_name} - ${brand.store.name} (${
                    brand.store.number || "S/N"
                })`,
                brand_name: brand.brand_name,
                store_name: brand.store.name,
                store_number: brand.store.number,
            }));
            setBrands(brandOptions);

            setAssignments(assignmentsRes.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            setError(
                error.response?.data?.error ||
                    "Erro ao carregar dados. Tente novamente."
            );
            showToast("Erro ao carregar dados", "error");
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
            await fetchData(); // Recarrega os dados após a atribuição
            setSuccess(true);
            setErrorMessage(null);
        } catch (error) {
            console.error("Erro ao criar atribuição:", error);
            const message =
                error.response?.data?.error || "Erro ao criar atribuição.";
            setErrorMessage(message);
            setSuccess(false);
        } finally {
            setLoading(false);
            setModalOpen(false);
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
            await fetchData(); // Recarrega os dados após a exclusão
        } catch (error) {
            console.error("Erro ao excluir atribuição:", error);
            const message =
                error.response?.data?.error || "Erro ao excluir atribuição.";
            setErrorMessage(message);
            setSuccess(false);
        } finally {
            setLoading(false);
            setModalOpen(false);
        }
    };

    const fetchPromoters = async () => {
        try {
            const data = await promoterRepository.getAllPromoters();
            setPromoters(data);
        } catch (error) {
            console.error("Erro ao buscar promotores:", error);
            showToast("Erro ao carregar promotores", "error");
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

            <form onSubmit={handleSubmit} className="assignment-form">
                <div className="form-group">
                    <label>Promotor:</label>
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
                </div>

                <div className="form-group">
                    <label>Marca:</label>
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

                <button type="submit" className="form-button">
                    Atribuir Marca
                </button>
            </form>

            <CustomModal
                visible={modalOpen}
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
                        <table className="assignments-table">
                            <thead>
                                <tr>
                                    <th>Promotor</th>
                                    <th>Email</th>
                                    <th>Marca</th>
                                    <th>Loja</th>
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
                                        <td>{`${assignment.store_name} (${
                                            assignment.store_number || "S/N"
                                        })`}</td>
                                        <td>
                                            <button
                                                onClick={() =>
                                                    handleDelete(assignment.id)
                                                }
                                                className="delete-button"
                                                title="Remover atribuição"
                                            >
                                                🗑️
                                            </button>
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
