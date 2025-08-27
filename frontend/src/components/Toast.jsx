import PropTypes from "prop-types";
import "../styles/toast.css";
import { message } from "antd";
import { useTranslation } from "react-i18next";

const ToastComponent = ({ message, type = "success", onClose }) => {
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

ToastComponent.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "error", "info"]),
    onClose: PropTypes.func.isRequired,
};

const defaultDuration = 3; // segundos

export const Toast = {
    success: (content) => {
        message.success({
            content,
            duration: defaultDuration,
        });
    },
    error: (content) => {
        message.error({
            content,
            duration: defaultDuration,
        });
    },
    warning: (content) => {
        message.warning({
            content,
            duration: defaultDuration,
        });
    },
    info: (content) => {
        message.info({
            content,
            duration: defaultDuration,
        });
    },
    loading: (content) => {
        return message.loading({
            content,
            duration: 0,
        });
    },
};

// Hook para usar o Toast com traduções
export const useToast = () => {
    const { t } = useTranslation(["common", "errors"]);

    return {
        success: (key, options = {}) => Toast.success(t(key, options)),
        error: (key, options = {}) => Toast.error(t(key, options)),
        warning: (key, options = {}) => Toast.warning(t(key, options)),
        info: (key, options = {}) => Toast.info(t(key, options)),
        loading: (key, options = {}) => Toast.loading(t(key, options)),
    };
};

export default ToastComponent;
