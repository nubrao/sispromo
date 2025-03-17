import PropTypes from "prop-types";
import "../styles/toast.css";

const Toast = ({ message, type = "success", onClose }) => {
    return (
        <div className={`toast ${type}`}>
            <div className="toast-content">
                <span>{message}</span>
                <button onClick={onClose} className="toast-close">
                    ✖
                </button>
            </div>
        </div>
    );
};

Toast.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "error", "info"]),
    onClose: PropTypes.func.isRequired,
};

export default Toast;
