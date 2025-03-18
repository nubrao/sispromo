import PropTypes from "prop-types";
import "../../styles/form.css";

const VisitFilters = ({
    filterPromoter,
    setFilterPromoter,
    filterStore,
    setFilterStore,
    filterBrand,
    setFilterBrand,
    filterDate,
    setFilterDate,
    clearFilters,
    isPromoter,
}) => {
    return (
        <div className="filter-container">
            {!isPromoter && (
                <input
                    type="text"
                    placeholder="Filtrar por promotor..."
                    value={filterPromoter}
                    onChange={(e) => setFilterPromoter(e.target.value)}
                    className="form-input-text"
                />
            )}
            <input
                type="text"
                placeholder="Filtrar por loja..."
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="form-input-text"
            />
            <input
                type="text"
                placeholder="Filtrar por marca..."
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="form-input-text"
            />
            <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="form-input-text"
            />
            <button onClick={clearFilters} className="clear-button">
                Limpar Filtros
            </button>
        </div>
    );
};

VisitFilters.propTypes = {
    filterPromoter: PropTypes.string.isRequired,
    setFilterPromoter: PropTypes.func.isRequired,
    filterStore: PropTypes.string.isRequired,
    setFilterStore: PropTypes.func.isRequired,
    filterBrand: PropTypes.string.isRequired,
    setFilterBrand: PropTypes.func.isRequired,
    filterDate: PropTypes.string.isRequired,
    setFilterDate: PropTypes.func.isRequired,
    clearFilters: PropTypes.func.isRequired,
    isPromoter: PropTypes.bool.isRequired,
};

export default VisitFilters;
