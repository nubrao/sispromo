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
    const [editVisitDate, setEditVisitDate] = useState("");
    const [filteredStores, setFilteredStores] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [editFilteredStores, setEditFilteredStores] = useState([]);
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
        if (promoterId) {
            const promoterIdNum = parseInt(promoterId, 10);

            const storesForPromoter = stores.filter((store) =>
                brands.some(
                    (brand) =>
                        brand.promoter_id === promoterIdNum &&
                        brand.store_name === store.name
                )
            );

            const brandsForPromoter = brands.filter(
                (brand) => brand.promoter_id === promoterIdNum
            );

            setFilteredStores([...storesForPromoter]);
            setFilteredBrands([...brandsForPromoter]);
        } else {
            setFilteredStores([]);
            setFilteredBrands([]);
        }
    }, [promoterId, stores, brands]);

    useEffect(() => {
        if (editPromoter) {
            const editPromoterIdNum = parseInt(editPromoter, 10);

            const editStoresForPromoter = stores.filter((store) =>
                brands.some(
                    (brand) =>
                        brand.promoter_id === editPromoterIdNum &&
                        brand.store_name === store.name
                )
            );

            const editBrandsForPromoter = brands.filter(
                (brand) => brand.promoter_id === editPromoterIdNum
            );

            setEditFilteredStores([...editStoresForPromoter]);
            setEditFilteredBrands([...editBrandsForPromoter]);
        } else {
            setEditFilteredStores([]);
            setEditFilteredBrands([]);
        }
    }, [editPromoter, stores, brands]);

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
        setEditBrand(visit.brand);
        setEditVisitDate(visit.visit_date);
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
                            {promoter.name}
                        </option>
                    ))}
                </select>

                <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="form-input-text"
                    required
                    disabled={!promoterId}
                >
                    <option value="">Selecione uma Loja</option>
                    {filteredStores.map((store) => (
                        <option key={store.id} value={store.id}>
                            {store.name} - {store.number}
                        </option>
                    ))}
                </select>

                <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="form-input-text"
                    required
                    disabled={!promoterId}
                >
                    <option value="">Selecione uma Marca</option>
                    {filteredBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                            {brand.brand_name}
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
                                                    {promoter.name}
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
                                            required
                                            disabled={!editPromoter}
                                        >
                                            {editFilteredStores.map((store) => (
                                                <option
                                                    key={store.id}
                                                    value={store.id}
                                                >
                                                    {store.name} -{" "}
                                                    {store.number}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={editBrand}
                                            onChange={(e) =>
                                                setEditBrand(e.target.value)
                                            }
                                            className="form-input-text"
                                            required
                                            disabled={!editPromoter}
                                        >
                                            {editFilteredBrands.map((brand) => (
                                                <option
                                                    key={brand.id}
                                                    value={brand.id}
                                                >
                                                    {brand.brand_name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="datetime-local"
                                            value={editVisitDate}
                                            onChange={(e) =>
                                                setEditVisitDate(e.target.value)
                                            }
                                            className="form-input-text"
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() =>
                                                handleSaveEdit(visit.id)
                                            }
                                            className="form-button save-button"
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="form-button cancel-button"
                                        >
                                            Cancelar
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{visit.promoter_name}</td>
                                    <td>{visit.store_display}</td>
                                    <td>{visit.brand}</td>
                                    <td>
                                        {new Date(
                                            visit.visit_date
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleEdit(visit)}
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
