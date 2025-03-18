import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import { CustomModal } from "../components/CustomModal";
import { AuthContext } from "../context/AuthContext";
import { RoleContext } from "../context/RoleContext";
import Toast from "../components/Toast";
import EditUserModal from "../components/EditUserModal";
import { message, Modal, Input, Form } from "antd";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
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
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
        useState(false);
    const [passwordModalLoading, setPasswordModalLoading] = useState(false);
    const [form] = Form.useForm();

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
            // Ordenar usuários por ID
            const sortedUsers = response.data.sort((a, b) => a.id - b.id);
            setUsers(sortedUsers);
            setFilteredUsers(sortedUsers);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            message.error("Erro ao carregar usuários");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = (userId) => {
        Modal.confirm({
            title: "Confirmar exclusão",
            content: "Tem certeza que deseja excluir este usuário?",
            okText: "Sim",
            cancelText: "Não",
            okButtonProps: {
                className: "ant-btn-ok",
            },
            cancelButtonProps: {
                className: "ant-btn-cancel",
            },
            onOk: async () => {
                try {
                    await axios.delete(`${API_URL}/api/users/${userId}/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    showToast("Usuário excluído com sucesso!", "success");
                    setTimeout(() => {
                        fetchUsers();
                    }, 2000);
                } catch (error) {
                    console.error("Erro ao excluir usuário:", error);
                    showToast("Erro ao excluir usuário", "error");
                }
            },
        });
    };

    const handleChangePassword = (userId) => {
        setSelectedUser({ id: userId });
        setIsChangePasswordModalOpen(true);
    };

    const handlePasswordSubmit = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            form.setFields([
                {
                    name: "confirmPassword",
                    errors: ["As senhas não coincidem"],
                },
            ]);
            return;
        }

        setPasswordModalLoading(true);

        try {
            await axios.patch(
                `${API_URL}/api/users/${selectedUser.id}/`,
                {
                    password: values.newPassword,
                    password_confirm: values.confirmPassword,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            showToast("Senha alterada com sucesso!", "success");
            setModalVisible(false);
            setTimeout(() => {
                setIsChangePasswordModalOpen(false);
                setPasswordModalLoading(false);
                form.resetFields();
            }, 2000);
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            showToast("Erro ao alterar senha", "error");
            setIsChangePasswordModalOpen(false);
        } finally {
            setPasswordModalLoading(false);
        }
    };

    const handleActiveChange = async (userId, isActive) => {
        try {
            await axios.patch(
                `${API_URL}/api/users/${userId}/`,
                { is_active: isActive },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast(
                `Usuário ${isActive ? "ativado" : "desativado"} com sucesso`,
                "success"
            );
            fetchUsers();
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            showToast("Erro ao alterar status do usuário", "error");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.patch(
                `${API_URL}/api/users/${userId}/`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const roleNames = {
                promoter: "Promotor",
                analyst: "Analista",
                manager: "Gestor",
            };
            showToast(`Função alterada para ${roleNames[newRole]}`, "success");
            fetchUsers();
        } catch (error) {
            console.error("Erro ao alterar função:", error);
            showToast("Erro ao alterar função do usuário", "error");
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleEditSave = async (editedUserData) => {
        try {
            // Remover campos que não devem ser atualizados via PATCH
            const { cpf, username, ...dataToUpdate } = editedUserData;

            await axios.patch(
                `${API_URL}/api/users/${selectedUser.id}/`,
                dataToUpdate,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            await fetchUsers();
            setIsEditModalOpen(false);
            showToast("Usuário atualizado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);

            // Tratamento específico para erros da API
            if (error.response?.data) {
                const errorData = error.response.data;
                let errorMessage = "";

                // Verifica se há mensagens de erro em campos específicos
                if (typeof errorData === "object") {
                    errorMessage = Object.entries(errorData)
                        .map(([field, errors]) => {
                            if (Array.isArray(errors)) {
                                return errors.join(", ");
                            }
                            return errors;
                        })
                        .join(". ");
                } else {
                    errorMessage = errorData;
                }

                showToast(errorMessage, "error");
            } else {
                showToast("Erro ao atualizar usuário", "error");
            }
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

            <CustomModal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                message={modalMessage}
            />

            <div className="table-container">
                {loading && !modalVisible ? (
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
                <Form form={form} onFinish={handlePasswordSubmit}>
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
