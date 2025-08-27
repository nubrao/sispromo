import { useState, useEffect, useContext } from "react";
import "../styles/form.css";
import Loader from "../components/Loader";
import { RoleContext } from "../contexts/RoleContext";
import { Toast } from "../components/Toast";
import EditUserModal from "../components/EditUserModal";
import userRepository from "../repositories/userRepository";
import { DeleteUserModal } from "../components/DeleteUserModal";
import { ChangePasswordModal } from "../components/ChangePasswordModal";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        role: "",
        status: "",
    });
    const { isManager, userProfileId } = useContext(RoleContext);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
        useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        if (isManager) {
            fetchUsers();
        }
    }, [isManager]);

    useEffect(() => {
        filterUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userRepository.getAllUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            Toast.showToast("Erro ao carregar usuários", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (userId) => {
        setUserToDelete(userId);
        setDeleteModalVisible(true);
    };

    const handleDeleteSuccess = async () => {
        setDeleteModalVisible(false);
        setUserToDelete(null);
        await fetchUsers();
    };

    const handleDeleteError = (error) => {
        console.error("Erro ao excluir usuário:", error);
        Toast.showToast("Erro ao excluir usuário", "error");
    };

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            await userRepository.updateUser(userId, {
                is_active: !currentStatus,
            });
            await fetchUsers();
            Toast.showToast(
                `Usuário ${
                    currentStatus ? "desativado" : "ativado"
                } com sucesso!`,
                "success"
            );
        } catch (error) {
            console.error("Erro ao alterar status do usuário:", error);
            Toast.showToast("Erro ao alterar status do usuário", "error");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await userRepository.updateUser(userId, { role: newRole });
            await fetchUsers();
            const roleNames = {
                promoter: "Promotor",
                analyst: "Analista",
                manager: "Gestor",
            };
            Toast.showToast(
                `Função alterada para ${roleNames[newRole]}`,
                "success"
            );
        } catch (error) {
            console.error("Erro ao alterar função do usuário:", error);
            Toast.showToast("Erro ao alterar função do usuário", "error");
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleEditSave = async (editedUserData) => {
        try {
            await userRepository.updateUser(selectedUser.id, editedUserData);
            await fetchUsers();
            setIsEditModalOpen(false);
            Toast.showToast("Usuário atualizado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);

            // Tratamento específico para erros da API
            if (error.response?.data) {
                const errorData = error.response.data;
                let errorMessage = "";

                // Verifica se há mensagens de erro em campos específicos
                if (typeof errorData === "object") {
                    errorMessage = Object.entries(errorData)
                        // eslint-disable-next-line no-unused-vars
                        .map(([_, errors]) => {
                            if (Array.isArray(errors)) {
                                return errors.join(", ");
                            }
                            return errors;
                        })
                        .join(". ");
                } else {
                    errorMessage = errorData;
                }

                Toast.showToast(errorMessage, "error");
            } else {
                Toast.showToast("Erro ao atualizar usuário", "error");
            }
        }
    };

    const handlePasswordModalOpen = (user) => {
        setSelectedUser(user);
        setIsChangePasswordModalOpen(true);
    };

    const handlePasswordModalClose = () => {
        setSelectedUser(null);
        setIsChangePasswordModalOpen(false);
    };

    if (!isManager) {
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
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
                <button
                    onClick={clearFilters}
                    className="form-button clear-button"
                >
                    Limpar Filtros
                </button>
            </div>
            <div className="table-container">
                {loading ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Usuário</th>
                                <th>Função</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        {user.first_name.toUpperCase()}{" "}
                                        {user.last_name.toUpperCase()}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.username}</td>
                                    <td>
                                        <select
                                            value={user.current_role}
                                            onChange={(e) =>
                                                handleRoleChange(
                                                    user.id,
                                                    e.target.value
                                                )
                                            }
                                            className="form-input-text"
                                            disabled={
                                                user.userprofile_id ===
                                                userProfileId
                                            }
                                            title={
                                                user.userprofile_id ===
                                                userProfileId
                                                    ? "Não é possível alterar a função do seu próprio usuário"
                                                    : "Ativar/inativar usuário"
                                            }
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
                                        <button
                                            className={`status-btn ${
                                                user.profile.is_active
                                                    ? "active"
                                                    : "inactive"
                                            } ${
                                                user.userprofile_id ===
                                                userProfileId
                                                    ? "disabled-action"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleToggleActive(
                                                    user.id,
                                                    user.profile.is_active
                                                )
                                            }
                                            disabled={
                                                user.userprofile_id ===
                                                userProfileId
                                            }
                                            title={
                                                user.userprofile_id ===
                                                userProfileId
                                                    ? "Não é possível alterar o status do seu próprio usuário"
                                                    : "Ativar/inativar usuário"
                                            }
                                        >
                                            {user.profile.is_active
                                                ? "Ativo"
                                                : "Inativo"}
                                        </button>
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
                                                    handlePasswordModalOpen(
                                                        user
                                                    )
                                                }
                                                className="form-button password-button"
                                                title="Alterar senha"
                                            >
                                                🔑
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(user.id)
                                                }
                                                className={`form-button delete-button ${
                                                    user.userprofile_id ===
                                                    userProfileId
                                                        ? "disabled-action"
                                                        : ""
                                                }`}
                                                disabled={
                                                    user.userprofile_id ===
                                                    userProfileId
                                                }
                                                title={
                                                    user.userprofile_id ===
                                                    userProfileId
                                                        ? "Não é possível excluir seu próprio usuário"
                                                        : "Excluir usuário"
                                                }
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modais */}
            <EditUserModal
                open={isEditModalOpen}
                setOpen={setIsEditModalOpen}
                user={selectedUser}
                onSave={handleEditSave}
            />

            <ChangePasswordModal
                visible={isChangePasswordModalOpen}
                onClose={handlePasswordModalClose}
                userId={selectedUser?.id}
            />

            <DeleteUserModal
                visible={deleteModalVisible}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setUserToDelete(null);
                }}
                onConfirm={handleDeleteSuccess}
                userId={userToDelete}
                onSuccess={handleDeleteSuccess}
                onError={handleDeleteError}
                currentUserId={userProfileId}
            />
        </div>
    );
};

export default UserManagement;
