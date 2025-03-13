import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import { AuthContext } from "../context/AuthContext";
import { RoleContext } from "../context/RoleContext";
import LoadingModal from "../components/LoadingModal";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const { token } = useContext(AuthContext);
    const { isManager } = useContext(RoleContext);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/users/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            setErrorMessage(
                "Erro ao carregar usuários. Por favor, tente novamente."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setModalOpen(true);
        setLoading(true);
        setErrorMessage("");

        try {
            await axios.patch(
                `${API_URL}/api/users/${userId}/`,
                { role: newRole },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setSuccess(true);
            await fetchUsers();
        } catch (error) {
            console.error("Erro ao atualizar papel do usuário:", error);
            setErrorMessage(
                "Erro ao atualizar permissão. Por favor, tente novamente."
            );
        } finally {
            setLoading(false);
            setTimeout(() => {
                setModalOpen(false);
                setSuccess(false);
                setErrorMessage("");
            }, 2000);
        }
    };

    const handleActiveChange = async (userId, isActive) => {
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
            setSuccess(true);
            await fetchUsers();
        } catch (error) {
            console.error("Erro ao atualizar status do usuário:", error);
            setErrorMessage(
                "Erro ao atualizar status. Por favor, tente novamente."
            );
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

            <LoadingModal
                open={modalOpen}
                success={success}
                loading={loading}
                errorMessage={errorMessage}
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
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) =>
                                                handleRoleChange(
                                                    user.id,
                                                    e.target.value
                                                )
                                            }
                                            className="form-input-text"
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
                                                checked={user.is_active}
                                                onChange={(e) =>
                                                    handleActiveChange(
                                                        user.id,
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
