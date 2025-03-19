import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import { CustomModal } from "../components/CustomModal";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import { RoleContext } from "../context/RoleContext";
import VisitFilters from "../components/visits/VisitFilters";
import VisitTable from "../components/visits/VisitTable";
import PropTypes from "prop-types";
import { visitRepository } from "../repositories/visitRepository";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { formatCPF, formatPhone } from "../hooks/useMask";
import { formatDate } from "../hooks/useFormatDate";
import Toast from "../components/Toast";
import promoterRepository from "../repositories/promoterRepository";
import userRepository from "../repositories/userRepository";

const Visits = ({
    loading,
    setLoading,
    modalOpen,
    setModalOpen,
    success,
    setSuccess,
    errorMessage,
    setErrorMessage,
    dataLoaded,
    setDataLoaded,
}) => {
    const [promoterId, setPromoterId] = useState("");
    const [storeId, setStoreId] = useState("");
    const [brand, setBrand] = useState({ id: "", name: "" });
    const [visits, setVisits] = useState([]);
    const [filteredVisits, setFilteredVisits] = useState([]);
    const [visitDate, setVisitDate] = useState("");
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);

    const [filterPromoter, setFilterPromoter] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filteredStores, setFilteredStores] = useState([]);

    // Estado para controle de edição
    const [editingVisit, setEditingVisit] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();
    const didFetchData = useRef(false);
    const { isPromoter } = useContext(RoleContext);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const fetchData = async () => {
            setLoading(true);
            setDataLoaded(false);

            try {
                // Se for promotor, define a data atual
                if (isPromoter) {
                    const today = new Date().toISOString().split("T")[0];
                    setVisitDate(today);
                }

                // Busca os dados do usuário atual primeiro
                if (isPromoter) {
                    const userResponse = await axios.get(
                        `${API_URL}/api/users/me/`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    setCurrentUser(userResponse.data);

                    // Busca o promotor associado ao usuário
                    const promoterResponse = await axios.get(
                        `${API_URL}/api/promoters/`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    // Procura o promotor vinculado ao perfil do usuário
                    const promoter = promoterResponse.data.find(
                        (p) =>
                            p.user_profile === userResponse.data.userprofile_id
                    );

                    if (promoter) {
                        setPromoterId(promoter.id);
                    } else {
                        setErrorMessage(
                            "Usuário não possui um promotor associado."
                        );
                    }
                }

                await Promise.all([
                    fetchBrands(),
                    fetchStores(),
                    fetchPromoters(),
                    fetchVisits(),
                ]);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setErrorMessage("Erro ao buscar dados do usuário.");
            } finally {
                setLoading(false);
                setDataLoaded(true);
            }
        };

        fetchData();
    }, [API_URL, token, isPromoter]);

    useEffect(() => {
        const filtered = visits.filter((visit) => {
            const visitDate = new Date(visit.visit_date)
                .toISOString()
                .split("T")[0];

            const isSameDate = !filterDate || visitDate === filterDate;

            return (
                visit?.promoter?.name
                    .toLowerCase()
                    .includes(filterPromoter.toLowerCase()) &&
                visit?.store?.name
                    .toLowerCase()
                    .includes(filterStore.toLowerCase()) &&
                visit?.brand?.brand_name
                    .toLowerCase()
                    .includes(filterBrand.toLowerCase()) &&
                isSameDate
            );
        });

        setFilteredVisits(filtered);
    }, [filterPromoter, filterStore, filterBrand, filterDate, visits]);

    useEffect(() => {
        if (brand.id) {
            // Filtra as lojas que estão vinculadas à marca selecionada
            const storesForBrand = brands
                .filter((b) => b.id === parseInt(brand.id))
                .map((b) => b.store_id);

            const filtered = stores.filter((store) =>
                storesForBrand.includes(store.id)
            );
            setFilteredStores(filtered);
        } else {
            setFilteredStores([]);
        }
    }, [brand.id, brands, stores]);

    const clearFilters = () => {
        setFilterPromoter("");
        setFilterStore("");
        setFilterBrand("");
        setFilterDate("");
        fetchVisits();
    };

    const fetchPromoters = async () => {
        try {
            const data = await promoterRepository.getAllPromoters();
            setPromoters(data);
        } catch (error) {
            console.error("Erro ao buscar promotores:", error);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stores/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStores(response.data);
        } catch (error) {
            console.error("Erro ao buscar lojas:", error);
        }
    };

    const fetchVisits = async () => {
        try {
            const promoterId =
                isPromoter && currentUser ? currentUser.promoter_id : null;
            const data = await visitRepository.fetchVisits(token, promoterId);
            setVisits(data);
        } catch (error) {
            console.error("Erro ao buscar visitas:", error);
            setErrorMessage("Erro ao buscar visitas.");
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/brands/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBrands(response.data);
        } catch (error) {
            console.error("Erro ao buscar marcas:", error);
        }
    };

    const handleBrandChange = (e) => {
        const selectedId = e.target.value ? parseInt(e.target.value, 10) : "";
        const selectedBrand = brands.find((b) => b.brand_id === selectedId) || {
            brand_id: "",
            brand_name: "",
        };

        setBrand({
            id: selectedBrand.brand_id,
            name: selectedBrand.brand_name,
        });
        setStoreId(""); // Limpa a loja selecionada quando trocar a marca
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setModalOpen(true);
        setLoading(true);

        const visitData = {
            store: parseInt(storeId),
            brand: parseInt(brand.id),
            visit_date: visitDate,
        };

        // Se for promotor, usa o promotor vinculado
        if (isPromoter) {
            if (!currentUser?.promoter_id) {
                setErrorMessage("Usuário não possui um promotor associado.");
                setLoading(false);
                setModalOpen(false);
                return;
            }
            visitData.promoter = parseInt(currentUser.promoter_id);
        } else {
            // Se for gestor ou analista, usa o promotor selecionado
            if (!promoterId) {
                setErrorMessage("Selecione um promotor.");
                setLoading(false);
                setModalOpen(false);
                return;
            }
            visitData.promoter = parseInt(promoterId);
        }

        try {
            if (editingVisit) {
                await visitRepository.updateVisit(
                    token,
                    editingVisit.id,
                    visitData
                );
            } else {
                await visitRepository.createVisit(token, visitData);
            }

            setSuccess(true);
            resetForm();
            await fetchVisits();
        } catch (error) {
            const message = await getErrorMessage(error);
            setErrorMessage(message);
            setSuccess(false);
        } finally {
            setLoading(false);
            setModalOpen(false);
        }
    };

    const handleEdit = (visit) => {
        setEditingVisit(visit);
        setPromoterId(visit.promoter.id);
        setStoreId(visit.store.id);
        setBrand({
            id: visit.brand.brand_id,
            name: visit.brand.brand_name,
        });
        setVisitDate(visit.visit_date);
    };

    const handleDelete = async (id) => {
        try {
            await visitRepository.deleteVisit(token, id);
            await fetchVisits();
        } catch (error) {
            console.error("Erro ao excluir visita:", error);
            setErrorMessage("Erro ao excluir visita.");
        }
    };

    const resetForm = () => {
        setEditingVisit(null);
        if (!isPromoter) setPromoterId("");
        setStoreId("");
        setBrand({ id: "", name: "" });
        setVisitDate("");
    };

    const getErrorMessage = async (error) => {
        if (error.response?.data?.error) {
            return translateMessage(error.response.data.error);
        }
        return translateMessage("Erro ao registrar visita.");
    };

    const fetchCurrentUser = async () => {
        try {
            const userData = await userRepository.getCurrentUser();
            setCurrentUser(userData);
        } catch (error) {
            console.error("Erro ao buscar usuário atual:", error);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">
                {editingVisit ? "Editar Visita" : "Registro de Visitas"}
            </h2>

            <form onSubmit={handleSubmit} className="form-input">
                {isPromoter ? (
                    <input
                        type="hidden"
                        value={currentUser?.promoter_id || ""}
                        name="promoterId"
                    />
                ) : (
                    <select
                        value={promoterId}
                        onChange={(e) => setPromoterId(e.target.value)}
                        className="form-input-text"
                        required
                    >
                        <option value="">Selecione um Promotor</option>
                        {promoters.map((promoter) => (
                            <option
                                key={`promoter-${promoter.id}`}
                                value={promoter.id}
                            >
                                {promoter.name.toUpperCase()}
                            </option>
                        ))}
                    </select>
                )}

                <select
                    value={brand.id || ""}
                    onChange={handleBrandChange}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione uma Marca</option>
                    {brands
                        .filter(
                            (brand, index, self) =>
                                index ===
                                self.findIndex(
                                    (b) => b.brand_id === brand.brand_id
                                )
                        )
                        .map((brand) => (
                            <option
                                key={`brand-${brand.brand_id}`}
                                value={brand.brand_id}
                            >
                                {brand.brand_name.toUpperCase()}
                            </option>
                        ))}
                </select>

                <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="form-input-text"
                    required
                    disabled={!brand.id}
                >
                    <option value="">
                        {!brand.id
                            ? "Selecione uma Marca primeiro"
                            : "Selecione uma Loja"}
                    </option>
                    {filteredStores.map((store) => (
                        <option key={`store-${store.id}`} value={store.id}>
                            {store.name.toUpperCase()} - {store.number}
                        </option>
                    ))}
                </select>

                <div className="form-dates">
                    <label className="form-label">Data da Visita:</label>
                    <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="form-input-text date-input"
                        max={new Date().toISOString().split("T")[0]}
                        required
                        disabled={!isPromoter}
                    />
                </div>

                <button type="submit" className="form-button">
                    {editingVisit ? "Atualizar" : "Cadastrar"}
                </button>
            </form>

            <VisitFilters
                filterPromoter={filterPromoter}
                setFilterPromoter={setFilterPromoter}
                filterStore={filterStore}
                setFilterStore={setFilterStore}
                filterBrand={filterBrand}
                setFilterBrand={setFilterBrand}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                clearFilters={clearFilters}
                isPromoter={isPromoter}
            />

            <VisitTable
                visits={filteredVisits}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                isPromoter={isPromoter}
                dataLoaded={dataLoaded}
            />

            <CustomModal
                isOpen={modalOpen}
                loading={loading}
                success={success}
                error={errorMessage}
            />
        </div>
    );
};

Visits.propTypes = {
    loading: PropTypes.bool.isRequired,
    setLoading: PropTypes.func.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    success: PropTypes.bool.isRequired,
    setSuccess: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    setErrorMessage: PropTypes.func.isRequired,
    dataLoaded: PropTypes.bool.isRequired,
    setDataLoaded: PropTypes.func.isRequired,
};

export default Visits;
