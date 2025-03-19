import { useState, useEffect } from "react";
import "../styles/form.css";
import { formatCPF, formatPhone } from "../hooks/useMask";
import { useTranslateMessage } from "../hooks/useTranslateMessage";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import { CustomModal } from "../components/CustomModal";
import { Modal } from "antd";
import Toast from "../components/Toast";
import promoterRepository from "../repositories/promoterRepository";
import userRepository from "../repositories/userRepository";

const PromoterForm = ({
    loading,
    setLoading,
    modalOpen,
    setModalOpen,
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
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success",
    });

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
            const data = await promoterRepository.getAllPromoters();
            setPromoters(data);
            setFilteredPromoters(data);
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

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: "", type: "success" });
        }, 3000);
    };

    const copyToClipboard = async (text) => {
        try {
            // Tenta usar a API do Clipboard
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                showToast("Senha copiada com sucesso!", "success");
                return;
            }

            // Fallback para o método mais antigo
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand("copy");
                textArea.remove();
                showToast("Senha copiada com sucesso!", "success");
            } catch (err) {
                textArea.remove();
                showToast(
                    "Erro ao copiar senha. Tente copiar manualmente.",
                    "error"
                );
            }
        } catch (err) {
            showToast(
                "Erro ao copiar senha. Tente copiar manualmente.",
                "error"
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setLoading(true);

        const promoterData = {
            first_name: firstName,
            last_name: lastName,
            cpf: cleanInput(cpf),
            phone: cleanInput(phone),
            email,
        };

        try {
            const response = await promoterRepository.createPromoter(
                promoterData
            );

            // Se chegou aqui, deu sucesso
            await fetchPromoters();
            resetForm();
            showToast("Promotor cadastrado com sucesso!", "success");

            // Se tiver senha temporária, mostra para o usuário
            if (response.temporary_password) {
                const tempPassword = response.temporary_password;
                Modal.success({
                    title: "Promotor cadastrado com sucesso!",
                    content: (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <span>A senha temporária do promotor é:</span>
                                <strong>{tempPassword}</strong>
                                <button
                                    onClick={() =>
                                        copyToClipboard(tempPassword)
                                    }
                                    className="form-button"
                                    style={{
                                        padding: "5px 10px",
                                        minWidth: "auto",
                                        fontSize: "14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                    }}
                                >
                                    <span>📋</span>
                                    <span>Copiar</span>
                                </button>
                            </div>
                        </div>
                    ),
                    okText: "Entendi",
                    okButtonProps: {
                        className: "ant-btn-ok",
                    },
                });
            }
        } catch (error) {
            let errorMsg = "Erro ao cadastrar promotor. Verifique os dados.";

            if (error.response?.data?.cpf) {
                errorMsg = await translateMessage(error.response.data.cpf[0]);
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }

            showToast(errorMsg, "error");
        } finally {
            setLoading(false);
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

    const handleEdit = async (promoter) => {
        setEditingId(promoter.id);
        setEditFirstName(promoter.first_name);
        setEditLastName(promoter.last_name);
        setEditCPF(promoter.cpf);
        setEditPhone(promoter.phone);
        setEditEmail(promoter.email || "");
    };

    const handleSaveEdit = async (id) => {
        setErrorMessage("");
        setLoading(true);

        const cleanedCPF = editCPF.replace(/\D/g, "");

        if (cleanedCPF.length !== 11) {
            showToast("CPF inválido.", "error");
            setLoading(false);
            return;
        }

        try {
            await promoterRepository.updatePromoter(id, {
                first_name: editFirstName,
                last_name: editLastName,
                cpf: cleanedCPF,
                phone: editPhone.replace(/\D/g, ""),
                email: editEmail,
            });

            setEditingId(null);
            await fetchPromoters();
            showToast("Promotor atualizado com sucesso!", "success");
        } catch (error) {
            let errorMsg = "Erro ao atualizar promotor. Verifique os dados.";

            if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }

            showToast(errorMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (promoterId) => {
        Modal.confirm({
            title: "Confirmar exclusão",
            content:
                "Tem certeza que deseja excluir este promotor? Esta ação também removerá o usuário associado.",
            okText: "Sim",
            cancelText: "Não",
            okButtonProps: {
                className: "ant-btn-ok",
            },
            cancelButtonProps: {
                className: "ant-btn-cancel",
            },
            onOk: async () => {
                setModalOpen(true);
                setLoading(true);
                setErrorMessage("");

                try {
                    // Primeiro, buscar os dados do promotor
                    const promoterData =
                        await promoterRepository.getPromoterById(promoterId);

                    // Buscar o usuário pelo CPF (que é usado como username)
                    try {
                        const users = await userRepository.getAllUsers();

                        // Encontrar o usuário que tem o mesmo CPF como username
                        const user = users.find(
                            (user) => user.username === promoterData.cpf
                        );

                        if (user) {
                            // Se encontrou o usuário, exclui ele primeiro
                            await userRepository.deleteUser(user.id);
                        } else {
                            // Se não encontrou o usuário, exclui apenas o promotor
                            await promoterRepository.deletePromoter(promoterId);
                        }

                        showToast("Promotor excluído com sucesso!", "success");
                        await fetchPromoters();
                    } catch (error) {
                        console.error("Erro ao buscar/excluir usuário:", error);
                        showToast(
                            "Erro ao excluir usuário e promotor",
                            "error"
                        );
                    }
                } catch (error) {
                    console.error("Erro ao excluir promotor:", error);
                    let errorMessage = "Erro ao excluir promotor";

                    if (error.response?.data?.detail) {
                        errorMessage = error.response.data.detail;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    showToast(errorMessage, "error");
                } finally {
                    setLoading(false);
                    setModalOpen(false);
                }
            },
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setErrorMessage("");
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Promotores</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <div className="form-input-break">
                    <input
                        type="text"
                        placeholder="Nome"
                        value={firstName.toUpperCase()}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="form-input-text name-input"
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        placeholder="Sobrenome"
                        value={lastName.toLocaleUpperCase()}
                        onChange={(e) => setLastName(e.target.value)}
                        className="form-input-text surname-input"
                        required
                        disabled={loading}
                    />
                </div>
                <input
                    type="email"
                    placeholder="Email"
                    value={email.toLowerCase()}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input-text"
                    required
                    disabled={loading}
                />
                <div className="form-input-break">
                    <input
                        type="text"
                        placeholder="CPF"
                        value={cpf}
                        onChange={(e) => setCPF(formatCPF(e.target.value))}
                        className="form-input-text cpf-input"
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        placeholder="Celular"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="form-input-text phone-input"
                        required
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    className="form-button"
                    disabled={loading}
                >
                    {loading ? <Loader size="small" /> : "Cadastrar"}
                </button>
            </form>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() =>
                        setToast({ show: false, message: "", type: "success" })
                    }
                />
            )}

            <CustomModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                loading={loading}
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
                    disabled={loading}
                />
                <input
                    type="text"
                    placeholder="Filtrar por CPF"
                    value={filterCPF}
                    onChange={(e) => setFilterCPF(formatCPF(e.target.value))}
                    className="form-input-text"
                    disabled={loading}
                />
                <input
                    type="text"
                    placeholder="Filtrar por telefone"
                    value={filterPhone}
                    onChange={(e) =>
                        setFilterPhone(formatPhone(e.target.value))
                    }
                    className="form-input-text"
                    disabled={loading}
                />
                <button
                    onClick={clearFilters}
                    className="form-button clear-button"
                    disabled={loading}
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
                                                    disabled={loading}
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
                                                    disabled={loading}
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
                                                    disabled={loading}
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
                                                    disabled={loading}
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
                                                    disabled={loading}
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
                                                        disabled={loading}
                                                    >
                                                        {loading ? (
                                                            <Loader size="small" />
                                                        ) : (
                                                            "Salvar"
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={
                                                            handleCancelEdit
                                                        }
                                                        className="form-button cancel-button"
                                                        disabled={loading}
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
                                                        disabled={loading}
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
                                                        disabled={loading}
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
    errorMessage: PropTypes.string.isRequired,
    setErrorMessage: PropTypes.func.isRequired,
};

export default PromoterForm;
