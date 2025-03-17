import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import { LoadingModal } from "../components/LoadingModal";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import { RoleContext } from "../context/RoleContext";
import Select from "react-select";

const VisitForm = ({
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

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();
    const didFetchData = useRef(false);
    const { isPromoter, isManagerOrAnalyst } = useContext(RoleContext);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const fetchData = async () => {
            setLoading(true);
            setDataLoaded(false);

            try {
                // Se for promotor, define a data atual
                if (isPromoter()) {
                    const today = new Date().toISOString().split("T")[0];
                    setVisitDate(today);
                }

                // Busca os dados do usuário atual primeiro
                if (isPromoter()) {
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
                        // Se não encontrar o promotor vinculado, tenta vincular
                        const availablePromoter = promoterResponse.data.find(
                            (p) => !p.user_profile
                        );

                        if (availablePromoter) {
                            try {
                                await axios.post(
                                    `${API_URL}/api/promoters/${availablePromoter.id}/link_user/`,
                                    { user_id: userResponse.data.id },
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    }
                                );
                                setPromoterId(availablePromoter.id);
                            } catch (error) {
                                console.error(
                                    "Erro ao vincular promotor:",
                                    error
                                );
                                setErrorMessage(
                                    "Erro ao vincular promotor ao usuário."
                                );
                            }
                        } else {
                            setErrorMessage(
                                "Nenhum promotor disponível para vinculação."
                            );
                        }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, token, isPromoter, setLoading, setDataLoaded]);

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
                visit?.brand?.name
                    .toString()
                    .includes(filterBrand.toString()) &&
                isSameDate
            );
        });

        setFilteredVisits(filtered);
    }, [filterPromoter, filterStore, filterBrand, filterDate, visits]);

    useEffect(() => {
        if (brand.id) {
            // Filtra as lojas que estão vinculadas à marca selecionada
            const storesForBrand = brands
                .filter((b) => b.brand_id === parseInt(brand.id))
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
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const promoterOptions = response.data.map((promoter) => ({
                value: promoter.id,
                label: `${promoter.name} (${promoter.email || "Sem email"})`,
                name: promoter.name,
                email: promoter.email,
            }));
            setPromoters(promoterOptions);
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
            let url = `${API_URL}/api/visits/`;
            if (isPromoter() && currentUser) {
                url += `?promoter_id=${currentUser.promoter_id}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVisits(response.data);
        } catch (error) {
            console.error("Erro ao buscar visitas:", error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setModalOpen(true);
        setLoading(true);

        const visitData = {
            store: storeId,
            brand: brand.id,
        };

        // Se for promotor, usa o promotor vinculado
        if (isPromoter()) {
            visitData.promoter = currentUser?.promoter_id;
        } else {
            // Se for gestor ou analista, usa o promotor selecionado
            visitData.promoter = promoterId;
        }

        // Só adiciona o campo de data se não for promotor
        if (!isPromoter()) {
            visitData.visit_date = visitDate;
        }

        try {
            // Verifica se já existe uma visita com os mesmos dados no mesmo dia
            const existingVisit = visits.find(
                (visit) =>
                    visit.promoter.id === parseInt(promoterId, 10) &&
                    visit.store.id === parseInt(storeId, 10) &&
                    visit.brand.id === parseInt(brand.id, 10) &&
                    visit.visit_date === visitDate
            );

            if (existingVisit) {
                const promoterName =
                    promoters.find((p) => p.value === parseInt(promoterId, 10))
                        ?.name || "";
                const storeName =
                    stores.find((s) => s.id === parseInt(storeId, 10))?.name ||
                    "";
                const brandName =
                    brands.find((b) => b.value === parseInt(brand.id, 10))
                        ?.label || "";

                setErrorMessage(
                    `Já existe uma visita cadastrada para ${promoterName.toUpperCase()} na loja ${storeName.toUpperCase()} para a marca ${brandName.toUpperCase()} nesta data.`
                );
                setLoading(false);
                setModalOpen(false);

                // Rola a tela até o registro existente
                const element = document.getElementById(
                    `visit-row-${existingVisit.id}`
                );
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                    element.style.backgroundColor = "#646cff33";
                    setTimeout(() => {
                        element.style.backgroundColor = "";
                    }, 3000);
                }
                return;
            }

            await axios.post(`${API_URL}/api/visits/`, visitData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            await refreshVisits();
            resetForm();
            setSuccess(true);
        } catch (error) {
            setErrorMessage(await getErrorMessage(error));
        } finally {
            finalizeModal();
        }
    };

    const resetForm = () => {
        setPromoterId("");
        setStoreId("");
        setBrand({ id: "", name: "" });
        setVisitDate("");
    };

    const refreshVisits = async () => {
        try {
            await fetchVisits();
        } catch (error) {
            console.error("Erro ao atualizar visitas:", error);
        }
    };

    const getErrorMessage = async (error) => {
        if (!error.response) return "Erro ao conectar com o servidor.";

        return error.response.data?.[0]
            ? await translateMessage(error.response.data[0])
            : "Erro ao cadastrar visita. Verifique os dados.";
    };

    const finalizeModal = () => {
        setLoading(false);
        setTimeout(() => {
            setModalOpen(false);
            setErrorMessage("");
            setSuccess(false);
        }, 3000);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta visita?")) {
            try {
                await axios.delete(`${API_URL}/api/visits/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchVisits();
            } catch (error) {
                console.error("Erro ao excluir visita:", error);
            }
        }
    };

    const handleBrandChange = (e) => {
        const selectedId = e.target.value ? parseInt(e.target.value, 10) : "";
        const selectedBrand = brands.find((b) => b.value === selectedId) || {
            value: "",
            label: "",
        };

        setBrand({
            id: selectedBrand.value,
            name: selectedBrand.label,
        });
        setStoreId(""); // Limpa a loja selecionada quando trocar a marca
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Registro de Visitas</h2>
            <form onSubmit={handleSubmit} className="form-input">
                {isManagerOrAnalyst && (
                    <Select
                        value={promoterId}
                        onChange={(e) => setPromoterId(e.value)}
                        options={promoters}
                        placeholder="Selecione um promotor"
                        className="react-select"
                        classNamePrefix="react-select"
                        isClearable
                        isSearchable
                    />
                )}
                <Select
                    value={storeId}
                    onChange={(e) => setStoreId(e.value)}
                    options={stores}
                    placeholder="Selecione uma loja"
                    className="react-select"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                />
                <Select
                    value={brand.id}
                    onChange={handleBrandChange}
                    options={brands}
                    placeholder="Selecione uma marca"
                    className="react-select"
                    classNamePrefix="react-select"
                    isClearable
                    isSearchable
                />
                <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="form-input-text"
                    required
                />
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}
                <button type="submit" className="form-button">
                    Registrar Visita
                </button>
            </form>

            <LoadingModal
                open={modalOpen}
                success={success}
                loading={loading}
                errorMessage={errorMessage}
                onClose={() => setModalOpen(false)}
            />

            <h3 className="form-title">Lista de Visitas</h3>

            <div className="filter-container">
                {isManagerOrAnalyst && (
                    <input
                        type="text"
                        placeholder="Filtrar por promotor"
                        value={filterPromoter}
                        onChange={(e) => setFilterPromoter(e.target.value)}
                        className="form-input-text"
                    />
                )}
                <input
                    type="text"
                    placeholder="Filtrar por loja"
                    value={filterStore}
                    onChange={(e) => setFilterStore(e.target.value)}
                    className="form-input-text"
                />
                <input
                    type="text"
                    placeholder="Filtrar por marca"
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="form-input-text"
                />
                <button onClick={clearFilters} className="form-button">
                    Limpar Filtros
                </button>
            </div>

            <div className="table-container">
                {loading && filteredVisits.length === 0 ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Promotor</th>
                                <th>Email</th>
                                <th>Loja</th>
                                <th>Marca</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisits.map((visit) => (
                                <tr key={visit.id}>
                                    <td>
                                        {new Date(
                                            visit.visit_date
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>{visit.promoter_name}</td>
                                    <td>{visit.promoter_email || "-"}</td>
                                    <td>{visit.store_name}</td>
                                    <td>{visit.brand_name}</td>
                                    <td>
                                        <div className="form-actions">
                                            <button
                                                onClick={() =>
                                                    handleDelete(visit.id)
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
                )}
            </div>
        </div>
    );
};

VisitForm.propTypes = {
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

export default VisitForm;
