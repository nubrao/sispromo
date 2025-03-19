import { useState, useEffect, useContext } from "react";
import "../styles/form.css";
import Loader from "../components/Loader";
import { RoleContext } from "../context/RoleContext";
import { Toast } from "../components/Toast";
import EditUserModal from "../components/EditUserModal";
import { Modal, Input, Form } from "antd";
import userRepository from "../repositories/userRepository";

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
    const [passwordModalLoading, setPasswordModalLoading] = useState(false);
    const [form] = Form.useForm();

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

    const handleDelete = async (userId) => {
        try {
            await userRepository.deleteUser(userId);
            await fetchUsers();
            Toast.showToast("Usuário excluído com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            Toast.showToast("Erro ao excluir usuário", "error");
        }
    };

    const handleChangePassword = async (values) => {
        setPasswordModalLoading(true);
        try {
            await userRepository.updateUser(selectedUser.id, {
                password: values.newPassword,
                password_confirm: values.confirmPassword,
            });
            setIsChangePasswordModalOpen(false);
            form.resetFields();
            Toast.showToast("Senha alterada com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            Toast.showToast("Erro ao alterar senha", "error");
        } finally {
            setPasswordModalLoading(false);
        }
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
                                        {user.first_name.toUpperCase()}{" "}
                                        {user.last_name.toUpperCase()}
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
                                                onChange={() =>
                                                    handleToggleActive(
                                                        user.id,
                                                        user.profile.is_active
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
                                                    handleDelete(user.id)
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
                )}
            </div>

            {/* Modal de edição */}
            {isEditModalOpen && selectedUser && (
                <EditUserModal
                    open={isEditModalOpen}
                    setOpen={setIsEditModalOpen}
                    user={selectedUser}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleEditSave}
                />
            )}

            {/* Modal de alterar senha */}
            <Modal
                title="Alterar Senha"
                open={isChangePasswordModalOpen}
                onOk={() => form.submit()}
                okText="Confirmar"
                okButtonProps={{
                    type: "primary",
                    loading: passwordModalLoading,
                    className: "ant-btn-ok",
                }}
                confirmLoading={passwordModalLoading}
                onCancel={() => {
                    setIsChangePasswordModalOpen(false);
                    form.resetFields();
                }}
                cancelText="Cancelar"
                cancelButtonProps={{
                    type: "default",
                    className: "ant-btn-cancel",
                }}
            >
                <Form form={form} onFinish={handleChangePassword}>
                    <Form.Item
                        name="newPassword"
                        rules={[
                            { required: true, message: "Digite a nova senha" },
                        ]}
                    >
                        <Input.Password
                            placeholder="Nova senha"
                            className="ant-input"
                        />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        dependencies={["newPassword"]}
                        rules={[
                            {
                                required: true,
                                message: "Confirme a nova senha",
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("newPassword") === value
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        "As senhas não coincidem"
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            placeholder="Confirme a nova senha"
                            className="ant-input"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
