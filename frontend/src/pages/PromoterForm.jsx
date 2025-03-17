import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import { formatCPF, formatPhone } from "../hooks/useMask";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import { LoadingModal } from "../components/LoadingModal";

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
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [cpf, setCPF] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [promoters, setPromoters] = useState([]);

    const [filteredPromoters, setFilteredPromoters] = useState([]);
    const [filterName, setFilterName] = useState("");
    const [filterCPF, setFilterCPF] = useState("");
    const [filterPhone, setFilterPhone] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editCPF, setEditCPF] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editEmail, setEditEmail] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();

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
            const fullName =
                `${promoter.first_name} ${promoter.last_name}`.toLowerCase();
            return (
                fullName.includes(lowerCaseName) &&
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
            first_name: firstName,
            last_name: lastName,
            cpf: cleanInput(cpf),
            phone: cleanInput(phone),
            email,
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
        setFirstName("");
        setLastName("");
        setCPF("");
        setPhone("");
        setEmail("");
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
        setEditFirstName(promoter.first_name);
        setEditLastName(promoter.last_name);
        setEditCPF(promoter.cpf);
        setEditPhone(promoter.phone);
        setEditEmail(promoter.email || "");
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
                    first_name: editFirstName,
                    last_name: editLastName,
                    cpf: cleanedCPF,
                    phone: editPhone.replace(/\D/g, ""),
                    email: editEmail,
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
                    value={firstName.toUpperCase()}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="text"
                    placeholder="Sobrenome"
                    value={lastName.toLocaleUpperCase()}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email.toLowerCase()}
                    onChange={(e) => setEmail(e.target.value)}
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

            <LoadingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                loading={loading}
                success={success}
                errorMessage={errorMessage}
            />

            <h3 className="form-title">Lista de Promotores</h3>

            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Filtrar por nome"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="form-input-text"
                />
                <input
                    type="text"
                    placeholder="Filtrar por CPF"
                    value={filterCPF}
                    onChange={(e) => setFilterCPF(formatCPF(e.target.value))}
                    className="form-input-text"
                />
                <input
                    type="text"
                    placeholder="Filtrar por telefone"
                    value={filterPhone}
                    onChange={(e) =>
                        setFilterPhone(formatPhone(e.target.value))
                    }
                    className="form-input-text"
                />
                <button onClick={clearFilters} className="form-button">
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
                                <th>Email</th>
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
                                                    value={editFirstName.toUpperCase()}
                                                    onChange={(e) =>
                                                        setEditFirstName(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-input-text"
                                                />
                                                <input
                                                    type="text"
                                                    value={editLastName.toUpperCase()}
                                                    onChange={(e) =>
                                                        setEditLastName(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-input-text"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="email"
                                                    value={editEmail.toLowerCase()}
                                                    onChange={(e) =>
                                                        setEditEmail(
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
                                                            formatCPF(
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
                                                    value={formatPhone(
                                                        editPhone
                                                    )}
                                                    onChange={(e) =>
                                                        setEditPhone(
                                                            formatPhone(
                                                                e.target.value
                                                            )
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
                                            <td>{promoter.email}</td>
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

PromoterForm.propTypes = {
    loading: PropTypes.bool.isRequired,
    setLoading: PropTypes.func.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    success: PropTypes.bool.isRequired,
    setSuccess: PropTypes.func.isRequired,
    errorMessage: PropTypes.string.isRequired,
    setErrorMessage: PropTypes.func.isRequired,
};

export default PromoterForm;
