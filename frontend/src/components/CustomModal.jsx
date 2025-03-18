import PropTypes from "prop-types";
import Loader from "./Loader";
import "../styles/modal.css";

export const CustomModal = ({
    visible,
    success,
    loading,
    errorMessage,
    title,
    message,
    onClose,
}) => {
    if (!visible) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{title || "" }</h3>
                {loading ? (
                    <div className="loading-container">
                        <Loader />
                        <p>{message || "Por favor, aguarde..."}</p>
                    </div>
                ) : success ? (
                    <div className="success-container">
                        <span className="success-icon">✓</span>
                        <p>{message || "Operação realizada com sucesso!"}</p>
                    </div>
                ) : (
                    <div className="error-container">
                        <span className="error-icon">✕</span>
                        <p>{errorMessage || "Ocorreu um erro."}</p>
                    </div>
                )}
                {!loading && (
                    <button onClick={onClose} className="modal-close-button">
                        Fechar
                    </button>
                )}
            </div>
        </div>
    );
};

CustomModal.propTypes = {
    visible: PropTypes.bool,
    success: PropTypes.bool,
    loading: PropTypes.bool,
    errorMessage: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
    onClose: PropTypes.func,
};
