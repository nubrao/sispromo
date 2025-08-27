import PropTypes from "prop-types";
import "../../styles/form.css";

const ExportActions = ({ onExportExcel, onExportPdf }) => {
    return (
        <div className="export-buttons">
            <button
                onClick={onExportExcel}
                className="form-button"
                title="Exportar para Excel"
            >
                📊 Excel
            </button>
            <button
                onClick={onExportPdf}
                className="form-button"
                title="Exportar para PDF"
            >
                📄 PDF
            </button>
        </div>
    );
};

ExportActions.propTypes = {
    onExportExcel: PropTypes.func.isRequired,
    onExportPdf: PropTypes.func.isRequired,
};

export default ExportActions;
