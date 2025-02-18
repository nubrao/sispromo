import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import { formatCPF, formatPhone } from "../hooks/useMask";
import useTranslateMessage from "../hooks/useTranslateMessage";

const PromoterForm = () => {
    const [name, setName] = useState("");
    const [cpf, setCPF] = useState("");
    const [phone, setPhone] = useState("");
    const [promoters, setPromoters] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editCPF, setEditCPF] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();

    useEffect(() => {
        fetchPromoters();
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        const cleanedCPF = cpf.replace(/\D/g, "");
        const cleanedPhone = phone.replace(/\D/g, "");

        try {
            await axios.post(
                `${API_URL}/api/promoters/`,
                { name, cpf: cleanedCPF, phone: cleanedPhone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPromoters();
            setName("");
            setCPF("");
            setPhone("");
        } catch (error) {
            if (error.response && error.response.status === 400) {
                if (error.response.data.cpf) {
                    const translatedMessage = await translateMessage(
                        error.response.data.cpf[0]
                    );
                    setErrorMessage(translatedMessage);
                } else {
                    const translatedMessage = await translateMessage(
                        "Erro ao cadastrar promotor. Verifique os dados."
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

    const handleEdit = (promoter) => {
        setEditingId(promoter.id);
        setEditName(promoter.name);
        setEditCPF(promoter.cpf);
        setEditPhone(promoter.phone);
    };

    const handleSaveEdit = async (id) => {
        setErrorMessage("");

        const cleanedCPF = editCPF.replace(/\D/g, "");

        if (cleanedCPF.length !== 11) {
            setErrorMessage("CPF inválido.");
            return;
        }

        try {
            await axios.put(
                `${API_URL}/api/promoters/${id}/`,
                {
                    name: editName,
                    cpf: cleanedCPF,
                    phone: editPhone.replace(/\D/g, ""),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditingId(null);
            fetchPromoters();
        } catch (error) {
            setErrorMessage("Erro ao atualizar promotor. Verifique os dados."),
                error;
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este promotor?")) {
            try {
                await axios.delete(`${API_URL}/api/promoters/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchPromoters();
            } catch (error) {
                console.error("Erro ao excluir promotor", error);
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setErrorMessage("");
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Promotores</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <input
                    type="text"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="text"
                    placeholder="CPF"
                    value={cpf}
                    onChange={(e) => setCPF(formatCPF(e.target.value))}
                    className="form-input-text"
                    required
                />
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}
                <input
                    type="text"
                    placeholder="Celular"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="form-input-text"
                    required
                />
                <button type="submit" className="form-button">
                    Cadastrar
                </button>
            </form>

            <h3 className="form-title">Lista de Promotores</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>Celular</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {promoters.map((promoter) => (
                        <tr key={promoter.id}>
                            {editingId === promoter.id ? (
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
                                            value={formatCPF(editCPF)}
                                            onChange={(e) =>
                                                setEditCPF(e.target.value)
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
                                        <input
                                            type="text"
                                            value={formatPhone(editPhone)}
                                            onChange={(e) =>
                                                setEditPhone(e.target.value)
                                            }
                                            className="form-input-text"
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() =>
                                                handleSaveEdit(promoter.id)
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
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{promoter.name}</td>
                                    <td>{formatCPF(promoter.cpf)}</td>
                                    <td>{formatPhone(promoter.phone)}</td>
                                    <td>
                                        <button
                                            onClick={() => handleEdit(promoter)}
                                            className="form-button edit-button"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(promoter.id)
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

export default PromoterForm;
