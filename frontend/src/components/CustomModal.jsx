import { Modal, Spin } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import "../styles/customModal.css";
import PropTypes from "prop-types";
export const CustomModal = ({
    loading,
    success,
    errorMessage,
    title,
    visible,
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            footer={null}
            closable={!loading}
            onCancel={onClose}
            centered
            className="custom-modal"
        >
            <div className="modal-content">
                {loading ? (
                    <div className="modal-loading">
                        <Spin size="large" />
                        <p>{title}</p>
                    </div>
                ) : success ? (
                    <div className="modal-success">
                        <CheckCircleOutlined className="success-icon" />
                        <p>Operação realizada com sucesso!</p>
                    </div>
                ) : (
                    <div className="modal-error">
                        <CloseCircleOutlined className="error-icon" />
                        <p>{errorMessage}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

CustomModal.propTypes = {
    loading: PropTypes.bool.isRequired,
    success: PropTypes.bool.isRequired,
    errorMessage: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};  

