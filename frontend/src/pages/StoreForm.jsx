import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/form.css";
import { formatCNPJ } from "../hooks/useMask";
import useTranslateMessage from "../hooks/useTranslateMessage";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import LoadingModal from "../components/LoadingModal";

const StoreForm = ({
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
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [city, setCity] = useState("");
    const [states, setStates] = useState([]);
    const [selectedState, setSelectedState] = useState("");
    const [cnpj, setCnpj] = useState("");

    const [stores, setStores] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [filterName, setFilterName] = useState("");
    const [filterNumber, setFilterNumber] = useState("");
    const [filterCity, setFilterCity] = useState("");
    const [filterState, setFilterState] = useState("");
    const [filterCNPJ, setFilterCNPJ] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editNumber, setEditNumber] = useState("");
    const [editCity, setEditCity] = useState("");
    const [editState, setEditState] = useState("");
    const [editCnpj, setEditCnpj] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();
    const cleanedCNPJ = isEditing ? editCnpj : cnpj.replace(/\D/g, "");
    const didFetchData = useRef(false);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterName, filterNumber, filterCity, filterState, filterCNPJ, stores]);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const fetchData = async () => {
            setLoading(true);
            setDataLoaded(false);

            try {
                await Promise.all([fetchStates(), fetchStores()]);
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

    const validateCNPJ = (cnpj) => {
        if (!cnpj) return "CNPJ Inválido";

        const cleanedCNPJ = cnpj.replace(/\D/g, "");

        if (cleanedCNPJ.length !== 14) return "CNPJ Inválido";

        return cleanedCNPJ.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
            "$1.$2.$3/$4-$5"
        );
    };

    const fetchStores = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stores/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStores(response.data);
            setFilteredStores(response.data);
        } catch (error) {
            console.error("Erro ao buscar lojas", error);
        }
    };

    const fetchStates = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/states/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (Array.isArray(response.data.states)) {
                setStates(response.data.states);
            } else {
                console.error("Formato inesperado dos estados:", response.data);
                setStates([]);
            }
        } catch (error) {
            console.error("Erro ao buscar estados", error);
            setStates([]);
        }
    };

    const applyFilters = () => {
        const lowerCaseName = filterName.toLowerCase();
        const formattedCNPJ = formatCNPJ(filterCNPJ).replace(/\D/g, "");

        const filtered = stores.filter((store) => {
            return (
                store.name.toLowerCase().includes(lowerCaseName) &&
                store.number.toString().includes(filterNumber) &&
                store.city.toLowerCase().includes(filterCity.toLowerCase()) &&
                store.state.toLowerCase().includes(filterState.toLowerCase()) &&
                store.cnpj.replace(/\D/g, "").includes(formattedCNPJ)
            );
        });

        setFilteredStores(filtered);
    };

    const clearFilters = () => {
        setFilterName("");
        setFilterNumber("");
        setFilterCity("");
        setFilterState("");
        setFilterCNPJ("");
        setFilteredStores(stores);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setModalOpen(true);
        setLoading(true);

        if (!isEditing && cleanedCNPJ.length !== 14) {
            setErrorMessage("CNPJ inválido.");
            return;
        }

        const storeData = {
            name,
            number,
            city,
            state: selectedState,
            cnpj: cleanedCNPJ,
        };

        try {
            await axios.post(`${API_URL}/api/stores/`, storeData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            fetchStores();
            resetForm();
            setSuccess(true);
        } catch (error) {
            setErrorMessage(await getErrorMessage(error));
        } finally {
            finalizeModal();
        }
    };

    const resetForm = () => {
        setName("");
        setNumber("");
        setCity("");
        setCnpj("");
        setSelectedState("");
    };

    const getErrorMessage = async (error) => {
        if (!error.response) return "Erro ao conectar com o servidor.";

        const { status, data } = error.response;

        if (!isEditing && status === 400) {
            return data?.cnpj
                ? await translateMessage(data.cnpj[0])
                : "Erro ao cadastrar loja. Verifique os dados.";
        }

        return "Erro ao cadastrar loja.";
    };

    const finalizeModal = () => {
        setLoading(false);
        setTimeout(() => {
            setModalOpen(false);
            setErrorMessage("");
            setSuccess(false);
        }, 3000);
    };

    const handleEdit = (store) => {
        setEditingId(store.id);
        setEditName(store.name);
        setEditNumber(store.number);
        setEditCity(store.city);
        setEditState(store.state);
        setEditCnpj(store.cnpj);
        setIsEditing(true);
    };

    const handleSaveEdit = async (id) => {
        setErrorMessage("");

        if (isEditing && cleanedCNPJ.length !== 14) {
            setErrorMessage("CNPJ inválido.");
            return;
        }

        try {
            await axios.put(
                `${API_URL}/api/stores/${id}/`,
                {
                    name: editName,
                    number: editNumber,
                    city: editCity,
                    state: editState,
                    cnpj: cleanedCNPJ,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setEditingId(null);
            fetchStores();
            setIsEditing(false);
        } catch (error) {
            if (isEditing && error.response?.data?.cnpj) {
                const translatedMessage = await translateMessage(
                    error.response.data.cnpj[0]
                );
                setErrorMessage(translatedMessage);
            } else {
                setErrorMessage("Erro ao atualizar loja. Verifique os dados.");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta loja?")) {
            try {
                await axios.delete(`${API_URL}/api/stores/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchStores();
            } catch (error) {
                console.error("Erro ao excluir loja", error);
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setErrorMessage("");
        setIsEditing(false);
    };

    const handleNumberInput = (value) => {
        return value.replace(/\D/g, "");
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Lojas</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <div className="form-storeName-number">
                    <input
                        type="text"
                        placeholder="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input-text storeName"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Número"
                        value={number}
                        onChange={(e) =>
                            setNumber(handleNumberInput(e.target.value))
                        }
                        className="form-input-text number"
                        required
                    />
                </div>
                <div className="form-city-state">
                    <input
                        type="text"
                        placeholder="Cidade"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="form-input-text city"
                        required
                    />
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        required
                        className="form-input-text state"
                    >
                        <option value="">Estado</option>
                        {states.map(([uf]) => (
                            <option key={uf} value={uf}>
                                {uf}
                            </option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="CNPJ"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    className="form-input-text"
                    required
                />
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}
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

            <h3 className="form-title">Lista de Lojas</h3>

            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Filtrar Nome"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="form-input-text"
                />
                <input
                    type="text"
                    placeholder="Filtrar Número"
                    value={filterNumber}
                    onChange={(e) =>
                        setFilterNumber(e.target.value.replace(/\D/g, ""))
                    }
                    className="form-input-text"
                />
                <input
                    type="text"
                    placeholder="Filtrar Cidade"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="form-input-text"
                />
                <input
                    type="text"
                    placeholder="Filtrar Estado"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="form-input-text"
                />
                <input
                    type="text"
                    placeholder="Filtrar CNPJ"
                    value={filterCNPJ}
                    onChange={(e) => setFilterCNPJ(formatCNPJ(e.target.value))}
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
                                <th>Nome</th>
                                <th>Número</th>
                                <th>Cidade</th>
                                <th>Estado</th>
                                <th>CNPJ</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStores.map((store) => (
                                <tr key={store.id}>
                                    {editingId === store.id ? (
                                        <>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={editName.toUpperCase()}
                                                    onChange={(e) =>
                                                        setEditName(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-input-text"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={editNumber}
                                                    onChange={(e) =>
                                                        setEditNumber(
                                                            handleNumberInput(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    className="form-input-text"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={editCity.toUpperCase()}
                                                    onChange={(e) =>
                                                        setEditCity(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-input-text"
                                                />
                                            </td>
                                            <td>{editState}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={formatCNPJ(editCnpj)}
                                                    onChange={(e) =>
                                                        setEditCnpj(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-input-text"
                                                />
                                                {errorMessage && (
                                                    <p className="error-message">
                                                        {errorMessage}
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                <div className="form-actions">
                                                    <button
                                                        onClick={() =>
                                                            handleSaveEdit(
                                                                store.id
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
                                            <td>{store.name.toUpperCase()}</td>
                                            <td>{store.number}</td>
                                            <td>{store.city.toUpperCase()}</td>
                                            <td>{store.state}</td>
                                            <td>{validateCNPJ(store.cnpj)}</td>
                                            <td>
                                                <div className="form-actions">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(store)
                                                        }
                                                        className="form-button edit-button"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                store.id
                                                            )
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
                )}
            </div>
        </div>
    );
};

StoreForm.propTypes = {
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

export default StoreForm;
