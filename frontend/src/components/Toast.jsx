import PropTypes from "prop-types";
import "../styles/toast.css";

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

class Toast {
    static removeToast(toast) {
        toast.classList.add("fade-out");
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300); // Tempo da animação de fade-out
    }

    static showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close">✖</button>
            </div>
        `;
        document.body.appendChild(toast);

        // Adiciona evento de clique no botão de fechar
        const closeButton = toast.querySelector(".toast-close");
        closeButton.addEventListener("click", () => {
            Toast.removeToast(toast);
        });

        // Remove o toast automaticamente após 3 segundos
        setTimeout(() => {
            if (document.body.contains(toast)) {
                Toast.removeToast(toast);
            }
        }, 3000);
    }
}

export { Toast };
export default ToastComponent;
