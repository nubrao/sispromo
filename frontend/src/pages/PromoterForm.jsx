import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import { formatCPF, formatPhone } from "../hooks/useMask";
import useTranslateMessage from "../hooks/useTranslateMessage";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import LoadingModal from "../components/LoadingModal";

const PromoterForm = ({
    loading,
    setLoading,
    modalOpen,
    setModalOpen,
    success,
    setSuccess,
    errorMessage,
    setErrorMessage,
}) => {
    const [name, setName] = useState("");
    const [cpf, setCPF] = useState("");
    const [phone, setPhone] = useState("");
    const [promoters, setPromoters] = useState([]);

    const [filteredPromoters, setFilteredPromoters] = useState([]);
    const [filterName, setFilterName] = useState("");
    const [filterCPF, setFilterCPF] = useState("");
    const [filterPhone, setFilterPhone] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editCPF, setEditCPF] = useState("");
    const [editPhone, setEditPhone] = useState("");

    // Novo estado para a data da visita
    const [visitDate, setVisitDate] = useState(
        new Date().toISOString().split("T")[0]
    ); // Data de hoje

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();

    // Adicione uma nova variável para armazenar o ID do promotor logado
    const promoterId = localStorage.getItem("promoterId"); // Supondo que o ID do promotor esteja armazenado no localStorage

    useEffect(() => {
        setLoading(true);
        fetchPromoters().finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterName, filterCPF, filterPhone, promoters]);

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPromoters(response.data);
            setFilteredPromoters(response.data);
        } catch (error) {
            console.error("Erro ao buscar promotores", error);
        }
    };

    const applyFilters = () => {
        const lowerCaseName = filterName.toLowerCase();

        const formattedCPF = formatCPF(filterCPF).replace(/\D/g, "");

        const formattedPhone = formatPhone(filterPhone).replace(/\D/g, "");

        const filtered = promoters.filter((promoter) => {
            return (
                promoter.name.toLowerCase().includes(lowerCaseName) &&
                promoter.cpf.replace(/\D/g, "").includes(formattedCPF) &&
                promoter.phone.replace(/\D/g, "").includes(formattedPhone)
            );
        });

        setFilteredPromoters(filtered);
    };

    const clearFilters = () => {
        setFilterName("");
        setFilterCPF("");
        setFilterPhone("");
        setFilteredPromoters(promoters);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setModalOpen(true);
        setLoading(true);

        const promoterData = {
            name,
            cpf: cleanInput(cpf),
            phone: cleanInput(phone),
            promoter_id: promoterId, // Incluindo o ID do promotor logado no payload
            visit_date: visitDate, // Incluindo a data da visita no payload
        };

        try {
            await axios.post(`${API_URL}/api/promoters/`, promoterData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            await fetchPromoters();
            resetForm();
            setSuccess(true);
        } catch (error) {
            setErrorMessage(await getErrorMessage(error));
        } finally {
            finalizeModal();
        }
    };

    const cleanInput = (value) => value.replace(/\D/g, "");

    const resetForm = () => {
        setName("");
        setCPF("");
        setPhone("");
        setVisitDate(new Date().toISOString().split("T")[0]); // Resetando a data para hoje
    };

    const getErrorMessage = async (error) => {
        if (!error.response) return "Erro ao conectar com o servidor.";

        return error.response.status === 400 && error.response.data.error.cpf
            ? await translateMessage(error.response.data.error.cpf[0])
            : "Erro ao cadastrar promotor. Verifique os dados.";
    };

    const finalizeModal = () => {
        setLoading(false);
        setTimeout(() => {
            setModalOpen(false);
            setSuccess(false);
            setErrorMessage("");
        }, 3000);
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
            setErrorMessage(
                "Erro ao atualizar promotor. Verifique os dados.",
                error
            );
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
                <input
                    type="date"
                    value={visitDate}
                    disabled={localStorage.getItem("userRole") === "promoter"} // Desabilita se o usuário for promotor
                    className="form-input-text"
                />
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

            <h3 className="form-title">Lista de Promotores</h3>

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
                    placeholder="Filtrar CPF"
                    value={filterCPF}
                    onChange={(e) => setFilterCPF(formatCPF(e.target.value))}
                    className="form-input-text"
                />

                <input
                    type="text"
                    placeholder="Filtrar Celular"
                    value={filterPhone}
                    onChange={(e) =>
                        setFilterPhone(formatPhone(e.target.value))
                    }
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
                {loading && filteredPromoters.length === 0 ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : (
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
                            {filteredPromoters.map((promoter) => (
                                <tr key={promoter.id}>
                                    {editingId === promoter.id ? (
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
                                                    value={formatCPF(editCPF)}
                                                    onChange={(e) =>
                                                        setEditCPF(
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
                                                <input
                                                    type="text"
                                                    value={formatPhone(
                                                        editPhone
                                                    )}
                                                    onChange={(e) =>
                                                        setEditPhone(
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
                                                                promoter.id
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
                                                {promoter.name.toUpperCase()}
                                            </td>
                                            <td>{formatCPF(promoter.cpf)}</td>
                                            <td>
                                                {formatPhone(promoter.phone)}
                                            </td>
                                            <td>
                                                <div className="form-actions">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(promoter)
                                                        }
                                                        className="form-button edit-button"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                promoter.id
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

PromoterForm.propTypes = {
    loading: PropTypes.bool.isRequired,
    setLoading: PropTypes.func.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    success: PropTypes.bool.isRequired,
    setSuccess: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    setErrorMessage: PropTypes.func.isRequired,
};

export default PromoterForm;
