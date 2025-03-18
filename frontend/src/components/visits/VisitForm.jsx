import PropTypes from "prop-types";
import "../../styles/form.css";

const VisitForm = ({
    promoterId,
    setPromoterId,
    storeId,
    setStoreId,
    brand,
    setBrand,
    visitDate,
    setVisitDate,
    promoters,
    stores,
    brands,
    handleSubmit,
    isPromoter,
    filteredStores,
    isEditing,
}) => {
    const handleBrandChange = (e) => {
        const selectedBrand = brands.find(
            (b) => b.brand_id === parseInt(e.target.value)
        );
        setBrand({
            id: selectedBrand?.brand_id || "",
            name: selectedBrand?.brand_name || "",
        });
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            {!isPromoter && (
                <select
                    value={promoterId}
                    onChange={(e) => setPromoterId(e.target.value)}
                    className="form-input"
                    required
                >
                    <option value="">Selecione um promotor</option>
                    {promoters.map((promoter) => (
                        <option key={promoter.id} value={promoter.id}>
                            {promoter.name}
                        </option>
                    ))}
                </select>
            )}

            <select
                value={brand.id}
                onChange={handleBrandChange}
                className="form-input"
                required
            >
                <option value="">Selecione uma marca</option>
                {brands.map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_id}>
                        {brand.brand_name}
                    </option>
                ))}
            </select>

            <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="form-input"
                required
                disabled={!brand.id}
            >
                <option value="">
                    {brand.id
                        ? "Selecione uma loja"
                        : "Selecione uma marca primeiro"}
                </option>
                {filteredStores.map((store) => (
                    <option key={store.id} value={store.id}>
                        {store.name} - {store.number}
                    </option>
                ))}
            </select>

            <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="form-input"
                required
            />

            <button type="submit" className="form-button">
                {isEditing ? "Atualizar Visita" : "Registrar Visita"}
            </button>
        </form>
    );
};

VisitForm.propTypes = {
    promoterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    setPromoterId: PropTypes.func.isRequired,
    storeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    setStoreId: PropTypes.func.isRequired,
    brand: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
    }).isRequired,
    setBrand: PropTypes.func.isRequired,
    visitDate: PropTypes.string.isRequired,
    setVisitDate: PropTypes.func.isRequired,
    promoters: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    stores: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            number: PropTypes.string.isRequired,
        })
    ).isRequired,
    brands: PropTypes.arrayOf(
        PropTypes.shape({
            brand_id: PropTypes.number.isRequired,
            brand_name: PropTypes.string.isRequired,
        })
    ).isRequired,
    handleSubmit: PropTypes.func.isRequired,
    isPromoter: PropTypes.bool.isRequired,
    filteredStores: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            number: PropTypes.string.isRequired,
        })
    ).isRequired,
    isEditing: PropTypes.bool,
};

VisitForm.defaultProps = {
    isEditing: false,
};

export default VisitForm;
