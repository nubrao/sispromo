import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";

const VisitForm = () => {
    const [promoterId, setPromoterId] = useState("");
    const [storeId, setStoreId] = useState("");
    const [brand, setBrand] = useState("");
    const [visitDate, setVisitDate] = useState("");

    const [visits, setVisits] = useState([]);
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editPromoter, setEditPromoter] = useState("");
    const [editStore, setEditStore] = useState("");
    const [editBrand, setEditBrand] = useState("");
    const [brands, setBrands] = useState([]);
    const [filterPromoter, setFilterPromoter] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filteredVisits, setFilteredVisits] = useState([]);

    const [editVisitDate, setEditVisitDate] = useState("");
    const [filteredStores, setFilteredStores] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [editFilteredBrands, setEditFilteredBrands] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchPromoters();
        fetchStores();
        fetchVisits();
        fetchBrands();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filterPromoter, filterStore, filterBrand, filterDate, visits]);

    const applyFilters = () => {
        const filtered = visits.filter((visit) => {
            const visitDate = new Date(visit.visit_date)
                .toISOString()
                .split("T")[0];

            const isSameDate = !filterDate || visitDate === filterDate;

            return (
                visit.promoter_name
                    .toLowerCase()
                    .includes(filterPromoter.toLowerCase()) &&
                visit.store_display
                    .toLowerCase()
                    .includes(filterStore.toLowerCase()) &&
                visit.brand.toLowerCase().includes(filterBrand.toLowerCase()) &&
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

        const visitData = {
            promoter: promoterId,
            store: storeId,
            brand,
            visit_date: visitDate,
        };

        try {
            await axios.post(`${API_URL}/api/visits/`, visitData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            fetchVisits();
            fetchBrands();
            setPromoterId("");
            setStoreId("");
            setBrand("");
            setVisitDate("");
        } catch (error) {
            console.error("Erro ao cadastrar visita", error);
        }
    };

    const handleEdit = (visit) => {
        setEditingId(visit.id);
        setEditPromoter(visit.promoter);
        setEditStore(visit.store);
        setEditVisitDate(visit.visit_date);

        const filteredBrands = brands.filter(
            (brand) => brand.store_id === parseInt(visit.store, 10)
        );
        setEditFilteredBrands(filteredBrands);

        const selectedBrand = filteredBrands.find(
            (brand) => brand.brand_id === parseInt(visit.brand, 10)
        );

        setEditBrand(selectedBrand ? selectedBrand.brand_id : "");
    };

    const handleSaveEdit = async (id) => {
        const updatedVisit = {
            promoter: editPromoter,
            store: editStore,
            brand: editBrand,
            visit_date: editVisitDate,
        };

        try {
            await axios.put(`${API_URL}/api/visits/${id}/`, updatedVisit, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEditingId(null);
            fetchVisits();
        } catch (error) {
            console.error("Erro ao atualizar visita", error);
        }
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

    const formatDateTimeLocal = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
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
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">
                        {!storeId
                            ? "Selecione uma Loja primeiro"
                            : "Selecione uma Marca"}
                    </option>
                    {filteredBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                            {brand.brand_name.toUpperCase()}
                        </option>
                    ))}
                </select>

                <input
                    type="datetime-local"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="form-input-text"
                    required
                />

                <button type="submit" className="form-button">
                    Cadastrar
                </button>
            </form>

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

                <input
                    type="date"
                    placeholder="Filtrar Data"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="form-input-text"
                />

                <button
                    onClick={clearFilters}
                    className="form-button clear-button"
                >
                    Limpar Filtros
                </button>
            </div>

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
                    {filteredVisits.map((visit) => (
                        <tr key={visit.id}>
                            {editingId === visit.id ? (
                                <>
                                    <td>
                                        <select
                                            value={editPromoter}
                                            onChange={(e) =>
                                                setEditPromoter(e.target.value)
                                            }
                                            className="form-input-text"
                                        >
                                            {promoters.map((promoter) => (
                                                <option
                                                    key={promoter.id}
                                                    value={promoter.id}
                                                >
                                                    {promoter.name.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={editStore}
                                            onChange={(e) =>
                                                setEditStore(e.target.value)
                                            }
                                            className="form-input-text"
                                        >
                                            <option value="">
                                                Selecione uma Loja
                                            </option>
                                            {stores.map((store) => (
                                                <option
                                                    key={store.id}
                                                    value={store.id}
                                                >
                                                    {store.name.toUpperCase()} -{" "}
                                                    {store.number}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={editBrand || ""}
                                            onChange={(e) =>
                                                setEditBrand(e.target.value)
                                            }
                                            className="form-input-text"
                                            required
                                        >
                                            <option value="">
                                                {!editStore
                                                    ? "Selecione uma Loja primeiro"
                                                    : "Selecione uma Marca"}
                                            </option>
                                            {editFilteredBrands.map((brand) => (
                                                <option
                                                    key={brand.brand_id}
                                                    value={brand.brand_id}
                                                >
                                                    {brand.brand_name.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="datetime-local"
                                            value={formatDateTimeLocal(
                                                editVisitDate
                                            )}
                                            onChange={(e) =>
                                                setEditVisitDate(e.target.value)
                                            }
                                            className="form-input-text"
                                        />
                                    </td>
                                    <td>
                                        <div className="form-actions">
                                            <button
                                                onClick={() =>
                                                    handleSaveEdit(visit.id)
                                                }
                                                className="form-button save-button"
                                            >
                                                Salvar
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setEditingId(null)
                                                }
                                                className="form-button cancel-button"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{visit.promoter_name.toUpperCase()}</td>
                                    <td>{visit.store_display.toUpperCase()}</td>
                                    <td>{visit.brand.toUpperCase()}</td>
                                    <td>
                                        {new Date(
                                            visit.visit_date
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="form-actions">
                                            <button
                                                onClick={() =>
                                                    handleEdit(visit)
                                                }
                                                className="form-button edit-button"
                                            >
                                                ✏️
                                            </button>
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
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default VisitForm;
