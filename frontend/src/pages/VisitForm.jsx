import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import LoadingModal from "../components/LoadingModal";
import useTranslateMessage from "../hooks/useTranslateMessage";

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
    const [visitDate, setVisitDate] = useState("");
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);

    const [filterPromoter, setFilterPromoter] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filteredVisits, setFilteredVisits] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);

    const [editFilteredBrands, setEditFilteredBrands] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editPromoter, setEditPromoter] = useState("");
    const [editStore, setEditStore] = useState("");
    const [editBrand, setEditBrand] = useState("");
    const [editVisitDate, setEditVisitDate] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();
    const didFetchData = useRef(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const fetchData = async () => {
            setLoading(true);
            setDataLoaded(false);

            try {
                await Promise.all([
                    fetchBrands(),
                    fetchStores(),
                    fetchPromoters(),
                    fetchVisits(),
                ]);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
                setDataLoaded(true);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterPromoter, filterStore, filterBrand, filterDate, visits]);

    useEffect(() => {
        setFilteredStores(stores);

        if (storeId) {
            const filtered = brands.filter(
                (brand) => brand.store_id === parseInt(storeId, 10)
            );
            setFilteredBrands(filtered);
        } else {
            setFilteredBrands([]);
        }
    }, [storeId, stores, brands]);

    useEffect(() => {
        if (editStore) {
            const filtered = brands.filter(
                (brand) => brand.store_id === parseInt(editStore, 10)
            );
            setEditFilteredBrands(filtered);

            if (!filtered.some((b) => b.brand_id === parseInt(editBrand, 10))) {
                setEditBrand(filtered.length > 0 ? filtered[0].brand_id : "");
            }
        } else {
            setEditFilteredBrands([]);
            setEditBrand("");
        }
    }, [editStore, brands, stores, editBrand]);

    useEffect(() => {
        if (editPromoter) {
            const editPromoterIdNum = parseInt(editPromoter, 10);

            const editBrandsForPromoter = brands.filter(
                (brand) => brand.promoter_id === editPromoterIdNum
            );

            setEditFilteredBrands([...editBrandsForPromoter]);
        } else {
            setEditFilteredBrands([]);
        }
    }, [editPromoter, stores, brands]);

    useEffect(() => {
        if (
            editBrand &&
            !editFilteredBrands.some(
                (brand) => brand.brand_id === parseInt(editBrand, 10)
            )
        ) {
            setEditBrand("");
        }
    }, [editFilteredBrands, editBrand]);

    const applyFilters = () => {
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
    };

    const clearFilters = () => {
        setFilterPromoter("");
        setFilterStore("");
        setFilterBrand("");
        setFilterDate("");
        setFilteredVisits(visits);
    };

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPromoters(response.data);
        } catch (error) {
            console.error("Erro ao buscar promotores", error);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stores/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStores(response.data);
        } catch (error) {
            console.error("Erro ao buscar lojas", error);
        }
    };

    const fetchVisits = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/visits/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVisits(response.data);
        } catch (error) {
            console.error("Erro ao buscar visitas", error);
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/brands/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBrands(response.data);
        } catch (error) {
            console.error("Erro ao buscar marcas", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setModalOpen(true);
        setLoading(true);

        const visitData = {
            promoter: promoterId,
            store: storeId,
            brand: brand.id,
            visit_date: visitDate,
        };

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
                    promoters.find((p) => p.id === parseInt(promoterId, 10))
                        ?.name || "";
                const storeName =
                    stores.find((s) => s.id === parseInt(storeId, 10))?.name ||
                    "";
                const brandName =
                    brands.find((b) => b.brand_id === parseInt(brand.id, 10))
                        ?.brand_name || "";

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
            console.error("Erro ao atualizar visitas", error);
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
                console.error("Erro ao excluir visita", error);
            }
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Visitas</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <select
                    value={promoterId}
                    onChange={(e) => setPromoterId(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione um Promotor</option>
                    {promoters.map((promoter) => (
                        <option key={promoter.id} value={promoter.id}>
                            {promoter.name.toUpperCase()}
                        </option>
                    ))}
                </select>

                <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione uma Loja</option>
                    {filteredStores.map((store) => (
                        <option key={store.id} value={store.id}>
                            {store.name.toUpperCase()} - {store.number}
                        </option>
                    ))}
                </select>

                <select
                    value={brand.id || ""}
                    onChange={(e) => {
                        const selectedId = e.target.value
                            ? parseInt(e.target.value, 10)
                            : "";
                        const selectedBrand = filteredBrands.find(
                            (brand) => brand.brand_id === selectedId
                        ) || { brand_id: "", brand_name: "" };

                        setBrand({
                            id: selectedBrand.brand_id,
                            name: selectedBrand.brand_name,
                        });
                    }}
                    className="form-input-text"
                    required
                >
                    <option value="">
                        {!storeId
                            ? "Selecione uma Loja primeiro"
                            : "Selecione uma Marca"}
                    </option>
                    {filteredBrands.map((brand) => (
                        <option key={brand.brand_id} value={brand.brand_id}>
                            {brand.brand_name.toUpperCase()}
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
                    />
                </div>

                <button type="submit" className="form-button">
                    Cadastrar
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
                <input
                    type="text"
                    placeholder="Filtrar Promotor"
                    value={filterPromoter}
                    onChange={(e) => setFilterPromoter(e.target.value)}
                    className="form-input-text"
                />

                <input
                    type="text"
                    placeholder="Filtrar Loja"
                    value={filterStore}
                    onChange={(e) => setFilterStore(e.target.value)}
                    className="form-input-text"
                />

                <input
                    type="text"
                    placeholder="Filtrar Marca"
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="form-input-text"
                />

                <div className="form-dates">
                    <label className="form-label">Data da Visita:</label>
                    <input
                        type="date"
                        placeholder="Filtrar Data"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="form-input-text date-input"
                        max={new Date().toISOString().split("T")[0]}
                    />
                </div>

                <button
                    onClick={clearFilters}
                    className="form-button clear-button"
                >
                    Limpar Filtros
                </button>
            </div>

            <div className="table-container">
                {!dataLoaded ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Promotor</th>
                                <th>Loja</th>
                                <th>Marca</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visits.map((visit) => (
                                <tr key={visit.id} id={`visit-row-${visit.id}`}>
                                    <td>{visit.promoter.name.toUpperCase()}</td>
                                    <td>
                                        {visit.store.name.toUpperCase()}
                                        {visit.store.number &&
                                            ` - ${visit.store.number}`}
                                    </td>
                                    <td>{visit.brand.name.toUpperCase()}</td>
                                    <td>
                                        {new Date(
                                            visit.visit_date
                                        ).toLocaleDateString("pt-BR")}
                                    </td>
                                    <td>
                                        <div className="form-actions">
                                            <button
                                                onClick={() =>
                                                    handleDelete(visit.id)
                                                }
                                                className="form-button delete-button"
                                            >
                                                ❌
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
