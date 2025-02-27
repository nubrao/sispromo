import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Loader from "./Loader";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 250,
    bgcolor: "#D4E9D4",
    borderRadius: "8px",
    boxShadow: 24,
    p: 4,
    textAlign: "center",
};

const LoadingModal = ({ open, success, errorMessage, loading, onClose }) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                {loading ? (
                    <>
                        <Loader />
                    </>
                ) : success ? (
                    <h3 style={{ color: "black" }}>
                        Cadastro realizado com sucesso! ✅
                    </h3>
                ) : errorMessage ? (
                    <>
                        <h3 style={{ color: "black" }}>
                            Ocorreu um erro ao cadastrar:
                        </h3>
                        <p style={{ color: "black" }}>{errorMessage}</p>
                    </>
                ) : null}
            </Box>
        </Modal>
    );
};

LoadingModal.propTypes = {
    open: PropTypes.bool.isRequired,
    success: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    loading: PropTypes.bool.isRequired,
};

export default LoadingModal;
