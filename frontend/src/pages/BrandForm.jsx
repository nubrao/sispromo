import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";

const BrandForm = () => {
    const [brandName, setBrandName] = useState("");
    const [selectedStore, setSelectedStore] = useState("");
    const [visitFrequency, setVisitFrequency] = useState("");

    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [filterBrandName, setFilterBrandName] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [filterVisitFrequency, setFilterVisitFrequency] = useState("");
    const [filteredBrands, setFilteredBrands] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [editBrandName, setEditBrandName] = useState("");
    const [editStore, setEditStore] = useState("");
    const [editVisitFrequency, setEditVisitFrequency] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchStores();
        fetchBrands();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filterBrandName, filterStore, filterVisitFrequency, brands]);

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

    const applyFilters = () => {
        const lowerCaseBrandName = filterBrandName.toLowerCase();
        const lowerCaseStore = filterStore.toLowerCase();
        const lowerCaseVisitFrequency = filterVisitFrequency.toString();

        const filtered = brands.filter((brand) => {
            return (
                brand.brand_name.toLowerCase().includes(lowerCaseBrandName) &&
                brand.store_name.toLowerCase().includes(lowerCaseStore) &&
                brand.visit_frequency
                    .toString()
                    .includes(lowerCaseVisitFrequency)
            );
        });

        setFilteredBrands(filtered);
    };

    const clearFilters = () => {
        setFilterBrandName("");
        setFilterStore("");
        setFilteredBrands(brands);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = {
            brand_name: brandName.trim(),
            store_name: selectedStore,
            visit_frequency: parseInt(visitFrequency, 10),
        };

        try {
            if (!brandName) {
                console.error("Nome da marca é obrigatório.");
                return;
            }

            await axios.post(`${API_URL}/api/brands/`, body, {
                headers: { Authorization: `Bearer ${token}` },
            });

            fetchBrands();
            setBrandName("");
            setSelectedStore("");
            setVisitFrequency("");
        } catch (error) {
            console.error("Erro ao cadastrar marca", error);
        }
    };

    const handleEdit = (brand) => {
        setEditingId(brand.brand_id);
        setEditBrandName(brand.brand_name);

        const store = stores.find((s) => s.name === brand.store_name);
        setEditStore(store ? store.id : "");

        setEditVisitFrequency(brand.visit_frequency);
    };

    const handleSaveEdit = async (id) => {
        try {
            await axios.put(
                `${API_URL}/api/brands/${id}/`,
                {
                    brand_name: editBrandName.trim(),
                    store_name: editStore,
                    visit_frequency: parseInt(editVisitFrequency, 10),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setEditingId(null);
            fetchBrands();
        } catch (error) {
            console.error("Erro ao editar marca", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/brands/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            fetchBrands();
        } catch (error) {
            console.error("Erro ao excluir marca", error);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Marcas</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <input
                    type="text"
                    placeholder="Nome da Marca"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="form-input-text"
                    required
                />

                <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione a Loja</option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.name}>
                            {store.name} - {store.number}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Periodicidade"
                    value={visitFrequency}
                    onChange={(e) => setVisitFrequency(e.target.value)}
                    className="form-input-text"
                    min="1"
                    required
                />

                <button type="submit" className="form-button">
                    Cadastrar
                </button>
            </form>

            <h3 className="form-title">Lista de Marcas</h3>

            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Filtrar Marca"
                    value={filterBrandName}
                    onChange={(e) => setFilterBrandName(e.target.value)}
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
                    type="number"
                    placeholder="Filtrar Periodicidade"
                    value={filterVisitFrequency}
                    onChange={(e) => setFilterVisitFrequency(e.target.value)}
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
                        <th>Marca</th>
                        <th>Loja</th>
                        <th>Periodicidade</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBrands.map((brand) => (
                        <tr key={brand.brand_id}>
                            {editingId === brand.brand_id ? (
                                <>
                                    <td>
                                        <input
                                            type="text"
                                            value={editBrandName.toUpperCase()}
                                            onChange={(e) =>
                                                setEditBrandName(e.target.value)
                                            }
                                            className="form-input-text"
                                        />
                                    </td>
                                    <td>
                                        {editingId === brand.brand_id ? (
                                            <select
                                                value={editStore}
                                                onChange={(e) =>
                                                    setEditStore(e.target.value)
                                                }
                                                className="form-input-text"
                                            >
                                                <option value="">
                                                    Selecione a Loja
                                                </option>
                                                {stores.map((store) => (
                                                    <option
                                                        key={store.id}
                                                        value={store.id}
                                                    >
                                                        {store.name.toUpperCase()}{" "}
                                                        - {store.number}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <>
                                                {brand.store_name.toUpperCase()}{" "}
                                                -{" "}
                                                {stores.find(
                                                    (store) =>
                                                        store.id ===
                                                        brand.store_id
                                                )?.number || ""}
                                            </>
                                        )}
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={editVisitFrequency}
                                            onChange={(e) =>
                                                setEditVisitFrequency(
                                                    e.target.value
                                                )
                                            }
                                            className="form-input-text"
                                        />
                                    </td>
                                    <td>
                                        <div className="form-actions">
                                            <button
                                                onClick={() =>
                                                    handleSaveEdit(
                                                        brand.brand_id
                                                    )
                                                }
                                                className="form-button save-button"
                                            >
                                                Salvar
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="form-button cancel-button"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{brand.brand_name.toUpperCase()}</td>
                                    <td>
                                        {brand.store_name.toUpperCase()}
                                        {" - "}
                                        {stores.find(
                                            (store) =>
                                                store.name === brand.store_name
                                        )?.number || ""}
                                    </td>
                                    <td>{brand.visit_frequency}x</td>
                                    <td>
                                        <div className="form-actions">
                                            <button
                                                onClick={() =>
                                                    handleEdit(brand)
                                                }
                                                className="form-button edit-button"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(brand.brand_id)
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

export default BrandForm;
