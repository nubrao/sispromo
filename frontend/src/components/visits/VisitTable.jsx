import PropTypes from "prop-types";
import "../../styles/form.css";

const VisitTable = ({ visits, handleDelete, handleEdit, isPromoter }) => {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th>Data</th>
                        {!isPromoter && <th>Promotor</th>}
                        <th>Loja</th>
                        <th>Marca</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {visits.map((visit) => (
                        <tr key={visit.id}>
                            <td>
                                {new Date(
                                    visit.visit_date
                                ).toLocaleDateString()}
                            </td>
                            {!isPromoter && (
                                <td>{visit.promoter?.name.toUpperCase() || "N/A"}</td>
                            )}
                            <td>{visit.store?.name.toUpperCase() + " - " + visit.store?.number || "N/A"}</td>
                            <td>{visit.brand?.brand_name.toUpperCase() || "N/A"}</td>
                            <td>
                                <div className="form-actions">
                                    <button
                                        onClick={() => handleEdit(visit)}
                                        className="edit-button"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(visit.id)}
                                        className="delete-button"
                                        title="Excluir"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

VisitTable.propTypes = {
    visits: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            visit_date: PropTypes.string.isRequired,
            promoter: PropTypes.shape({
                id: PropTypes.number.isRequired,
                name: PropTypes.string.isRequired,
            }),
            store: PropTypes.shape({
                id: PropTypes.number.isRequired,
                name: PropTypes.string.isRequired,
            }),
            brand: PropTypes.shape({
                id: PropTypes.number.isRequired,
                name: PropTypes.string.isRequired,
            }),
        })
    ).isRequired,
    handleDelete: PropTypes.func.isRequired,
    handleEdit: PropTypes.func.isRequired,
    isPromoter: PropTypes.bool.isRequired,
};

export default VisitTable;
