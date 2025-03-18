import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import { CustomModal } from "../components/CustomModal";
import CreatableSelect from "react-select/creatable";

const BrandForm = ({
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
    const [selectedStore, setSelectedStore] = useState({ id: "", name: "" });
    const [visitFrequency, setVisitFrequency] = useState("");
    const [selectedBrand, setSelectedBrand] = useState(null);

    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [filterBrandName, setFilterBrandName] = useState("");
    const [filterStore, setFilterStore] = useState("");
    const [filterVisitFrequency, setFilterVisitFrequency] = useState("");
    const [filteredBrands, setFilteredBrands] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [editBrandName, setEditBrandName] = useState("");
    const [editStore, setEditStore] = useState({ id: "", name: "" });
    const [editVisitFrequency, setEditVisitFrequency] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const didFetchData = useRef(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const fetchData = async () => {
            setLoading(true);
            setDataLoaded(false);

            try {
                await Promise.all([fetchBrands(), fetchStores()]);
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
        setErrorMessage("");
        setModalOpen(true);
        setLoading(true);

        if (!selectedBrand) {
            setErrorMessage("Por favor, selecione ou crie uma marca");
            setLoading(false);
            setModalOpen(false);
            return;
        }

        if (!selectedStore.id) {
            setErrorMessage("Por favor, selecione uma loja");
            setLoading(false);
            setModalOpen(false);
            return;
        }

        try {
            // Normaliza o nome da marca para uppercase
            const normalizedBrandName = selectedBrand.label
                .trim()
                .toUpperCase();

            // Verifica se já existe uma marca com o mesmo nome (case insensitive)
            const existingBrand = brands.find(
                (brand) =>
                    brand.brand_name.toUpperCase() === normalizedBrandName
            );

            // Verifica se já existe a combinação marca/loja
            const existingBrandStore = brands.find(
                (brand) =>
                    brand.brand_name.toUpperCase() === normalizedBrandName &&
                    brand.store_id === selectedStore.id
            );

            if (existingBrandStore) {
                setErrorMessage(
                    `Esta marca já está cadastrada para esta loja. Você pode editar o registro existente com periodicidade ${existingBrandStore.visit_frequency}x.`
                );
                setLoading(false);
                setModalOpen(false);

                // Rola a tela até o registro existente
                const element = document.getElementById(
                    `brand-row-${existingBrandStore.brand_id}`
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

            const brandToUse = existingBrand
                ? {
                      brand_id: existingBrand.brand_id,
                      brand_name: existingBrand.brand_name,
                  }
                : { brand_name: normalizedBrandName };

            const body = {
                ...brandToUse,
                store_id: selectedStore.id,
                visit_frequency: parseInt(visitFrequency, 10),
            };

            await axios.post(`${API_URL}/api/brands/`, body, {
                headers: { Authorization: `Bearer ${token}` },
            });

            await fetchBrands();
            resetForm();
            setSuccess(true);
        } catch (error) {
            console.error("Erro ao cadastrar marca", error);
            setErrorMessage(
                error.response?.data?.[0] || "Erro ao cadastrar marca"
            );
        } finally {
            finalizeModal();
        }
    };

    const resetForm = () => {
        setSelectedBrand(null);
        setSelectedStore({ id: "", name: "" });
        setVisitFrequency("");
    };

    const finalizeModal = () => {
        setLoading(false);
        setTimeout(() => {
            setModalOpen(false);
            setErrorMessage("");
            setSuccess(false);
        }, 3000);
    };

    const handleEdit = (brand) => {
        // Usamos a combinação de brand_id e store_id como identificador único
        setEditingId(`${brand.brand_id}-${brand.store_id}`);
        setEditBrandName(brand.brand_name);

        const store = stores.find((s) => s.id === brand.store_id);
        setEditStore(store || { id: "", name: "" });

        setEditVisitFrequency(brand.visit_frequency);
    };

    const handleSaveEdit = async (brandId, storeId) => {
        try {
            // Normaliza o nome da marca para uppercase
            const normalizedBrandName = editBrandName.trim().toUpperCase();

            // Verifica se já existe outra marca com o mesmo nome e loja (excluindo o registro atual)
            const existingBrand = brands.find(
                (brand) =>
                    (brand.brand_id !== parseInt(brandId) ||
                        brand.store_id !== parseInt(storeId)) &&
                    brand.brand_name.toUpperCase() === normalizedBrandName &&
                    brand.store_id === editStore.id
            );

            if (existingBrand) {
                setErrorMessage(
                    "Já existe uma marca com este nome para esta loja"
                );
                return;
            }

            await axios.put(
                `${API_URL}/api/brands/${brandId}/`,
                {
                    brand_name: normalizedBrandName,
                    store_id: editStore.id,
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
            setErrorMessage("Erro ao editar marca");
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditStore({ id: "", name: "" });
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
                <CreatableSelect
                    isClearable
                    options={brands
                        // Remove duplicatas baseado no nome da marca (case insensitive)
                        .filter(
                            (brand, index, self) =>
                                index ===
                                self.findIndex(
                                    (b) =>
                                        b.brand_name.toUpperCase() ===
                                        brand.brand_name.toUpperCase()
                                )
                        )
                        .map((brand) => ({
                            value: brand.brand_id,
                            label: brand.brand_name.toUpperCase(),
                        }))}
                    value={selectedBrand}
                    onChange={(newValue) => setSelectedBrand(newValue)}
                    placeholder="Selecione ou crie uma marca"
                    className="form-input-select"
                    formatCreateLabel={(inputValue) =>
                        `Criar marca "${inputValue}"`
                    }
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            backgroundColor: "#1a1a1a",
                            borderColor: state.isFocused
                                ? "#646cff"
                                : "#3f3f3f",
                            color: "white",
                            "&:hover": {
                                borderColor: "#646cff",
                            },
                        }),
                        input: (baseStyles) => ({
                            ...baseStyles,
                            color: "white",
                        }),
                        placeholder: (baseStyles) => ({
                            ...baseStyles,
                            color: "#9ca3af",
                        }),
                        singleValue: (baseStyles) => ({
                            ...baseStyles,
                            color: "white",
                        }),
                        option: (baseStyles, { isFocused, isSelected }) => ({
                            ...baseStyles,
                            backgroundColor: isSelected
                                ? "#646cff"
                                : isFocused
                                ? "#3f3f3f"
                                : "#1a1a1a",
                            color: "white",
                            cursor: "pointer",
                            ":active": {
                                backgroundColor: "#646cff",
                            },
                        }),
                        menu: (baseStyles) => ({
                            ...baseStyles,
                            backgroundColor: "#1a1a1a",
                            border: "1px solid #3f3f3f",
                        }),
                        dropdownIndicator: (baseStyles) => ({
                            ...baseStyles,
                            color: "#9ca3af",
                            "&:hover": {
                                color: "white",
                            },
                        }),
                        clearIndicator: (baseStyles) => ({
                            ...baseStyles,
                            color: "#9ca3af",
                            "&:hover": {
                                color: "white",
                            },
                        }),
                    }}
                />

                <select
                    value={selectedStore.id}
                    onChange={(e) => {
                        const selected = stores.find(
                            (store) => store.id === parseInt(e.target.value)
                        );
                        setSelectedStore(
                            selected
                                ? { id: selected.id, name: selected.name }
                                : { id: "", name: "" }
                        );
                    }}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione a Loja</option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                            {store.name.toUpperCase()} - {store.number}
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

            <CustomModal
                open={modalOpen}
                success={success}
                loading={loading}
                errorMessage={errorMessage}
                onClose={() => setModalOpen(false)}
            />

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
            <div className="table-container">
                {!dataLoaded ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : (
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
                                <tr
                                    key={`${brand.brand_id}-${brand.store_id}`}
                                    id={`brand-row-${brand.brand_id}-${brand.store_id}`}
                                >
                                    {editingId ===
                                    `${brand.brand_id}-${brand.store_id}` ? (
                                        <>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={editBrandName.toUpperCase()}
                                                    onChange={(e) =>
                                                        setEditBrandName(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-input-text"
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={editStore.id}
                                                    onChange={(e) => {
                                                        const selectedStore =
                                                            stores.find(
                                                                (store) =>
                                                                    store.id ===
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                        10
                                                                    )
                                                            );
                                                        setEditStore(
                                                            selectedStore || {
                                                                id: "",
                                                                name: "",
                                                            }
                                                        );
                                                    }}
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
                                                                brand.brand_id,
                                                                brand.store_id
                                                            )
                                                        }
                                                        className="form-button save-button"
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        onClick={
                                                            handleCancelEdit
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
                                            <td>
                                                {brand.brand_name.toUpperCase()}
                                            </td>
                                            <td>
                                                {brand.store_name.toUpperCase()}
                                                {" - "}
                                                {stores.find(
                                                    (store) =>
                                                        store.name ===
                                                        brand.store_name
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
                                                            handleDelete(
                                                                brand.brand_id
                                                            )
                                                        }
                                                        className="form-button delete-button"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

BrandForm.propTypes = {
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

export default BrandForm;
