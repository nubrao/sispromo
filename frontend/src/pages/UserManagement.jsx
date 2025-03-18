import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import { LoadingModal } from "../components/LoadingModal";
import { AuthContext } from "../context/AuthContext";
import { RoleContext } from "../context/RoleContext";
import Toast from "../components/Toast";
import EditUserModal from "../components/EditUserModal";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success",
    });
    const [filters, setFilters] = useState({
        search: "",
        role: "",
        status: "",
    });
    const { token } = useContext(AuthContext);
    const { isManager, userProfileId } = useContext(RoleContext);
    const API_URL = import.meta.env.VITE_API_URL;
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (isManager()) {
            fetchUsers();
        }
    }, [isManager]);

    useEffect(() => {
        filterUsers();
    }, [filters, users]);

    const filterUsers = () => {
        let result = [...users];

        // Filtro de busca (nome, email, username)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                (user) =>
                    user.first_name?.toLowerCase().includes(searchLower) ||
                    user.last_name?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.username?.toLowerCase().includes(searchLower)
            );
        }

        // Filtro por função
        if (filters.role) {
            result = result.filter(
                (user) => user.current_role === filters.role
            );
        }

        // Filtro por status
        if (filters.status !== "") {
            const isActive = filters.status === "active";
            result = result.filter((user) => user.is_active === isActive);
        }

        setFilteredUsers(result);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            role: "",
            status: "",
        });
    };

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: "", type: "success" });
        }, 3000);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/users/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            showToast(
                "Erro ao carregar usuários. Por favor, tente novamente.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setModalTitle("Alterando Papel do Usuário");
        setModalMessage("Processando alteração...");
        setModalOpen(true);
        setLoading(true);
        setErrorMessage("");

        try {
            await axios.patch(
                `${API_URL}/api/users/${userId}/update_role/`,
                { role: newRole },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            await fetchUsers();
        } catch (error) {
            console.error("Erro ao atualizar papel do usuário:", error);
            const errorMsg =
                error.response?.data?.error ||
                "Erro ao atualizar permissão. Por favor, tente novamente.";
            setErrorMessage(errorMsg);
            setModalMessage(errorMsg);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setModalOpen(false);
                setSuccess(false);
                setErrorMessage("");
            }, 2000);
            setModalMessage("Papel do usuário atualizado com sucesso!");
            setSuccess(true);
        }
    };

    const handleActiveChange = async (userId, isActive) => {
        setModalTitle(isActive ? "Ativando Usuário" : "Desativando Usuário");
        setModalMessage("Processando alteração...");
        setModalOpen(true);
        setLoading(true);
        setErrorMessage("");

        try {
            await axios.patch(
                `${API_URL}/api/users/${userId}/`,
                { is_active: isActive },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            await fetchUsers();
        } catch (error) {
            console.error("Erro ao atualizar status do usuário:", error);
            const errorMsg =
                error.response?.data?.error ||
                "Erro ao atualizar status. Por favor, tente novamente.";
            setErrorMessage(errorMsg);
            setModalMessage(errorMsg);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setModalOpen(false);
                setSuccess(false);
                setErrorMessage("");
            }, 2000);
            setSuccess(true);
            setModalMessage(
                `Usuário ${isActive ? "ativado" : "desativado"} com sucesso!`
            );
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Tem certeza que deseja excluir este usuário?")) {
            return;
        }

        setModalTitle("Excluindo Usuário");
        setModalMessage("Processando exclusão...");
        setModalOpen(true);
        setLoading(true);
        setErrorMessage("");

        try {
            await axios.delete(`${API_URL}/api/users/${userId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchUsers();
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            const errorMsg =
                error.response?.data?.error ||
                "Erro ao excluir usuário. Por favor, tente novamente.";
            setErrorMessage(errorMsg);
            setModalMessage(errorMsg);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setModalOpen(false);
                setSuccess(false);
                setErrorMessage("");
            }, 2000);
            setModalMessage("Usuário excluído com sucesso!");
            setSuccess(true);
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleEditSave = async (editedUserData) => {
        try {
            await axios.patch(
                `${API_URL}/api/users/${selectedUser.id}/`,
                editedUserData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            await fetchUsers();
            setIsEditModalOpen(false);
            setToast({
                message: "Usuário atualizado com sucesso!",
                type: "success",
                show: true,
            });
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            setToast({
                message:
                    error.response?.data?.error || "Erro ao atualizar usuário",
                type: "error",
                show: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (userId) => {
        const newPassword = window.prompt(
            "Digite a nova senha para o usuário:"
        );
        if (!newPassword) return;

        setModalTitle("Alterando Senha");
        setModalMessage("Processando alteração...");
        setModalOpen(true);
        setLoading(true);
        setErrorMessage("");

        try {
            await axios.patch(
                `${API_URL}/api/users/${userId}/`,
                {
                    password: newPassword,
                    password_confirm: newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setSuccess(true);
            setModalMessage("Senha alterada com sucesso!");
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            const errorMsg =
                error.response?.data?.error ||
                "Erro ao alterar senha. Por favor, tente novamente.";
            setErrorMessage(errorMsg);
            setModalMessage(errorMsg);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setModalOpen(false);
                setSuccess(false);
                setErrorMessage("");
            }, 2000);
        }
    };

    if (!isManager()) {
        return (
            <div className="form-container">
                <h2 className="form-title">Acesso Negado</h2>
                <p>Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    return (
        <div className="form-container">
            <h2 className="form-title">Gerenciamento de Usuários</h2>

            {/* Filtros */}
            <div className="filter-container">
                <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Buscar por nome, email ou usuário..."
                    className="form-input-text"
                />
                <select
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                    className="form-input-text"
                >
                    <option value="">Todas as funções</option>
                    <option value="promoter">Promotor</option>
                    <option value="analyst">Analista</option>
                    <option value="manager">Gestor</option>
                </select>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="form-input-text"
                >
                    <option value="">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </select>
                <button
                    onClick={clearFilters}
                    className="form-button clear-button"
                >
                    Limpar Filtros
                </button>
            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() =>
                        setToast({ show: false, message: "", type: "success" })
                    }
                />
            )}

            <LoadingModal
                open={modalOpen}
                success={success}
                loading={loading}
                errorMessage={errorMessage}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalOpen(false)}
            />

            {loading && !modalOpen ? (
                <div className="loading-container">
                    <Loader />
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Usuário</th>
                                <th>E-mail</th>
                                <th>Regra</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        {user.first_name.toUpperCase()} {user.last_name.toUpperCase()}
                                    </td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={
                                                user.current_role || "promoter"
                                            }
                                            onChange={(e) =>
                                                handleRoleChange(
                                                    user.id,
                                                    e.target.value
                                                )
                                            }
                                            className="form-input-text"
                                            disabled={user.id === userProfileId}
                                        >
                                            <option value="promoter">
                                                Promotor
                                            </option>
                                            <option value="analyst">
                                                Analista
                                            </option>
                                            <option value="manager">
                                                Gestor
                                            </option>
                                        </select>
                                    </td>
                                    <td>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={user.profile.is_active}
                                                onChange={(e) =>
                                                    handleActiveChange(
                                                        user.id,
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={
                                                    user.id === userProfileId
                                                }
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div className="form-actions">
                                            <button
                                                onClick={() =>
                                                    handleEditClick(user)
                                                }
                                                className="form-button edit-button"
                                                title="Editar usuário"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleChangePassword(
                                                        user.id
                                                    )
                                                }
                                                className="form-button password-button"
                                                title="Alterar senha"
                                            >
                                                🔑
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(user.id)
                                                }
                                                className="form-button delete-button"
                                                disabled={
                                                    user.id === userProfileId
                                                }
                                                title="Excluir usuário"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isEditModalOpen && selectedUser && (
                <EditUserModal
                    open={isEditModalOpen}
                    user={selectedUser}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleEditSave}
                />
            )}
        </div>
    );
};

export default UserManagement;
