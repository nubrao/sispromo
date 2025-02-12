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
    const [errorMessage, setErrorMessage] = useState("");
    const [stores, setStores] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();

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
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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

        const cleanedCNPJ = cnpj.replace(/\D/g, "");

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
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            fetchStores();
            setName("");
            setNumber("");
            setCity("");
            setSelectedState("");
            setCnpj("");
        } catch (error) {
            if (error.response && error.response.status === 400) {
                if (error.response.data.cnpj) {
                    const translatedMessage = await translateMessage(
                        error.response.data.cnpj[0]
                    );
                    setErrorMessage(translatedMessage);
                } else {
                    const translatedMessage = await translateMessage(
                        "Erro ao cadastrar loja. Verifique os dados."
                    );
                    setErrorMessage(translatedMessage);
                }
            } else {
                const translatedMessage = await translateMessage(
                    "Erro ao conectar com o servidor."
                );
                setErrorMessage(translatedMessage);
            }
        }
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
                        <th>Numero</th>
                        <th>Cidade</th>
                        <th>Estado</th>
                        <th>CNPJ</th>
                    </tr>
                </thead>
                <tbody>
                    {stores.map((store) => (
                        <tr key={store.id}>
                            <td>{store.name}</td>
                            <td>{store.number}</td>
                            <td>{store.city}</td>
                            <td>{store.state}</td>
                            <td>{validateCNPJ(store.cnpj)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StoreForm;
