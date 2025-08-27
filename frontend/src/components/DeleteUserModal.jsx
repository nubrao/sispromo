import { Modal } from "antd";
import { Toast } from "./Toast";
import userRepository from "../repositories/userRepository";
import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const DeleteUserModal = ({
    visible,
    onClose,
    userId,
    onSuccess,
    onError,
    currentUserId,
}) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleDelete = async () => {
        setLoading(true);
        try {
            // Busca o usuário para verificar se é o atual
            const user = await userRepository.getUserById(userId);

            // Verifica se o userProfile_id do usuário corresponde ao currentUserId
            if (user && user.userprofile_id === currentUserId) {
                Toast.showToast(
                    "Não é possível excluir seu próprio usuário",
                    "error"
                );
                if (typeof onError === "function") {
                    onError(
                        new Error("Não é possível excluir seu próprio usuário")
                    );
                }
                setLoading(false);
                return;
            }

            await userRepository.deleteUser(userId);
            Toast.showToast("Usuário excluído com sucesso!", "success");

            // Dispara um evento global para atualizar todas as listas
            const event = new CustomEvent("userDeleted", {
                detail: { userId },
            });
            window.dispatchEvent(event);

            // Se estiver na página de promotores, força uma atualização
            if (window.location.pathname.includes("/promoters")) {
                navigate(0); // Recarrega a página atual
            }

            // Fecha o modal e limpa o estado
            if (typeof onClose === "function") {
                onClose();
            }
            if (typeof onSuccess === "function") {
                onSuccess();
            }
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            Toast.showToast("Erro ao excluir usuário", "error");
            if (typeof onError === "function") {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Confirmar Exclusão"
            open={visible}
            onOk={handleDelete}
            onCancel={onClose}
            okText="Sim"
            cancelText="Não"
            okButtonProps={{
                className: "ant-btn-ok",
                loading: loading,
            }}
            cancelButtonProps={{
                className: "ant-btn-cancel",
                disabled: loading,
            }}
            closable={!loading}
            maskClosable={!loading}
        >
            <p>Tem certeza que deseja excluir este usuário?</p>
        </Modal>
    );
};

DeleteUserModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userId: PropTypes.string,
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func,
    currentUserId: PropTypes.string,
};

export default DeleteUserModal;
