import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import Loader from "../components/Loader";
import PropTypes from "prop-types";
import { CustomModal } from "../components/CustomModal";

const VisitPriceForm = ({
    loading,
    setLoading,
    modalOpen,
    setModalOpen,
    success,
    setSuccess,
    errorMessage,
    setErrorMessage,
}) => {
    const [prices, setPrices] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedStore, setSelectedStore] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [price, setPrice] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [filteredStores, setFilteredStores] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedBrand) {
            // Filtra as lojas que estão vinculadas à marca selecionada
            const storesForBrand = brands
                .filter((b) => b.brand_id === parseInt(selectedBrand, 10))
                .map((b) => b.store_id);

            const filtered = stores.filter((store) =>
                storesForBrand.includes(store.id)
            );
            setFilteredStores(filtered);
        } else {
            setFilteredStores([]);
        }
    }, [selectedBrand, brands, stores]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [storesRes, brandsRes, pricesRes] = await Promise.all([
                axios.get(`${API_URL}/api/stores/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_URL}/api/brands/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_URL}/api/visit-prices/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setStores(storesRes.data);
            setBrands(brandsRes.data);
            setPrices(pricesRes.data);
        } catch (error) {
            console.error("Erro ao buscar dados", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBrandChange = (e) => {
        setSelectedBrand(e.target.value);
        setSelectedStore(""); // Limpa a loja selecionada quando trocar a marca
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setModalOpen(true);

        try {
            // Verifica se já existe preço para esta combinação loja/marca
            const existingPrice = prices.find(
                (price) =>
                    price.store === parseInt(selectedStore, 10) &&
                    price.brand === parseInt(selectedBrand, 10)
            );

            if (existingPrice && !editingId) {
                setErrorMessage(
                    `Já existe um preço cadastrado para esta loja e marca (R$ ${existingPrice.price.toFixed(
                        2
                    )}). Você pode editar o registro existente.`
                );
                setLoading(false);
                setModalOpen(false);

                // Rola a tela até o registro existente
                const element = document.getElementById(
                    `price-row-${existingPrice.id}`
                );
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                    element.style.backgroundColor = "#646cff33";
                    setTimeout(() => {
                        element.style.backgroundColor = "";
                    }, 3000);
                }
                return;
            }

            const body = {
                store: selectedStore,
                brand: selectedBrand,
                price: parseFloat(price),
            };

            if (editingId) {
                await axios.put(
                    `${API_URL}/api/visit-prices/${editingId}/`,
                    body,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(`${API_URL}/api/visit-prices/`, body, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            await fetchData();
            resetForm();
            setSuccess(true);
        } catch (error) {
            console.error("Erro ao salvar preço da visita", error);
            setErrorMessage("Erro ao salvar preço da visita");
        } finally {
            finalizeModal();
        }
    };

    const resetForm = () => {
        setSelectedStore("");
        setSelectedBrand("");
        setPrice("");
        setEditingId(null);
    };

    const finalizeModal = () => {
        setLoading(false);
        setTimeout(() => {
            setModalOpen(false);
            setErrorMessage("");
            setSuccess(false);
        }, 3000);
    };

    const handleEdit = (price) => {
        setEditingId(price.id);
        setSelectedBrand(price.brand);
        // Aguarda o useEffect atualizar as lojas filtradas antes de definir a loja
        setTimeout(() => {
            setSelectedStore(price.store);
        }, 0);
        setPrice(price.price.toString());
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este preço?")) {
            try {
                await axios.delete(`${API_URL}/api/visit-prices/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchData();
            } catch (error) {
                console.error("Erro ao excluir preço", error);
            }
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Parametrizar Valores de Visita</h2>

            <form onSubmit={handleSubmit} className="form-input">
                <select
                    value={selectedBrand}
                    onChange={handleBrandChange}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione uma Marca</option>
                    {brands
                        .filter(
                            (brand, index, self) =>
                                index ===
                                self.findIndex(
                                    (b) => b.brand_id === brand.brand_id
                                )
                        )
                        .map((brand) => (
                            <option key={brand.brand_id} value={brand.brand_id}>
                                {brand.brand_name.toUpperCase()}
                            </option>
                        ))}
                </select>

                <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="form-input-text"
                    required
                    disabled={!selectedBrand}
                >
                    <option value="">
                        {!selectedBrand
                            ? "Selecione uma Marca primeiro"
                            : "Selecione uma Loja"}
                    </option>
                    {filteredStores.map((store) => (
                        <option key={store.id} value={store.id}>
                            {store.name.toUpperCase()} - {store.number}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Valor da Visita"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input-text"
                    required
                />

                <button type="submit" className="form-button">
                    {editingId ? "Atualizar" : "Cadastrar"}
                </button>
            </form>

            <CustomModal
                open={modalOpen}
                success={success}
                loading={loading}
                errorMessage={errorMessage}
                onClose={() => setModalOpen(false)}
            />

            <div className="table-container">
                {loading ? (
                    <div className="loading-container">
                        <Loader />
                    </div>
                ) : (
                    <div className="visit-prices-list">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Marca</th>
                                    <th>Loja</th>
                                    <th>Valor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prices.map((price) => (
                                    <tr
                                        key={price.id}
                                        id={`price-row-${price.id}`}
                                    >
                                        <td>
                                            {price.brand_name.toUpperCase()}
                                        </td>
                                        <td>
                                            {price.store_name.toUpperCase()}{" "}
                                            {price.store_number
                                                ? `- ${price.store_number}`
                                                : ""}
                                        </td>
                                        <td>
                                            {typeof price.price === "number"
                                                ? `R$ ${price.price.toFixed(2)}`
                                                : `R$ ${parseFloat(
                                                      price.price
                                                  ).toFixed(2)}`}
                                        </td>
                                        <td>
                                            <div className="form-actions">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(price)
                                                    }
                                                    className="form-button edit-button"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(price.id)
                                                    }
                                                    className="form-button delete-button"
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
                )}
            </div>
        </div>
    );
};

VisitPriceForm.propTypes = {
    loading: PropTypes.bool.isRequired,
    setLoading: PropTypes.func.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    success: PropTypes.bool.isRequired,
    setSuccess: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    setErrorMessage: PropTypes.func.isRequired,
};

export default VisitPriceForm;
