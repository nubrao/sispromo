import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import { formatCNPJ } from "../hooks/useMask";
import useTranslateMessage from "../hooks/useTranslateMessage";

const StoreForm = () => {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [city, setCity] = useState("");
    const [states, setStates] = useState([]);
    const [selectedState, setSelectedState] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [stores, setStores] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
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

    useEffect(() => {
        fetchStores();
        fetchStates();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!isEditing && cleanedCNPJ.length !== 14) {
            setErrorMessage("CNPJ inválido.");
            return;
        }

        try {
            await axios.post(
                `${API_URL}/api/stores/`,
                {
                    name,
                    number,
                    city,
                    state: selectedState,
                    cnpj: cleanedCNPJ,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchStores();
            setName("");
            setNumber("");
            setCity("");
            setSelectedState("");
            setCnpj("");
        } catch (error) {
            if (!isEditing && error.response && error.response.status === 400) {
                if (error.response?.data.cnpj) {
                    const translatedMessage = await translateMessage(
                        error.response.data.cnpj[0]
                    );
                    setErrorMessage(translatedMessage);
                } else {
                    const translatedMessage =
                        "Erro ao cadastrar loja. Verifique os dados.";
                    setErrorMessage(translatedMessage);
                }
            } else {
                const translatedMessage = "Erro ao conectar com o servidor.";
                setErrorMessage(translatedMessage);
            }
        }
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

            <h3 className="form-title">Lista de Lojas</h3>
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
                    {stores.map((store) => (
                        <tr key={store.id}>
                            {editingId === store.id ? (
                                <>
                                    <td>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) =>
                                                setEditName(e.target.value)
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
                                            value={editCity}
                                            onChange={(e) =>
                                                setEditCity(e.target.value)
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
                                                setEditCnpj(e.target.value)
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
                                                    handleSaveEdit(store.id)
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
                                    <td>{store.name}</td>
                                    <td>{store.number}</td>
                                    <td>{store.city}</td>
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
                                                    handleDelete(store.id)
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

export default StoreForm;
