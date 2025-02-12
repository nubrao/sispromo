import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";

const VisitForm = () => {
    const [promoterId, setPromoterId] = useState("");
    const [storeId, setStoreId] = useState("");
    const [brand, setBrand] = useState("");
    const [visitDate, setVisitDate] = useState("");
    const [visits, setVisits] = useState([]);
    const [promoters, setPromoters] = useState([]);
    const [stores, setStores] = useState([]);

    useEffect(() => {
        fetchPromoters();
        fetchStores();
        fetchVisits();
    }, []);

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(
                "http://127.0.0.1:8000/api/promoters/"
            );
            setPromoters(response.data);
        } catch (error) {
            console.error("Error fetching promoters", error);
        }
    };

    const fetchStores = async () => {
        try {
            const response = await axios.get(
                "http://127.0.0.1:8000/api/stores/"
            );
            setStores(response.data);
        } catch (error) {
            console.error("Error fetching stores", error);
        }
    };

    const fetchVisits = async () => {
        try {
            const response = await axios.get(
                "http://127.0.0.1:8000/api/visits/"
            );
            setVisits(response.data);
        } catch (error) {
            console.error("Error fetching visits", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("promoter", promoterId);
        formData.append("store", storeId);
        formData.append("brand", brand);
        formData.append("visit_date", visitDate);

        try {
            await axios.post("http://127.0.0.1:8000/api/visits/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            fetchVisits();
            setPromoterId("");
            setStoreId("");
            setBrand("");
            setVisitDate("");
        } catch (error) {
            console.error("Error creating visit", error);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Visitas</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <select
                    value={promoterId}
                    onChange={(e) => setPromoterId(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione um Promotor</option>
                    {promoters.map((promoter) => (
                        <option key={promoter.id} value={promoter.id}>
                            {promoter.name}
                        </option>
                    ))}
                </select>

                <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="form-input-text"
                    required
                >
                    <option value="">Selecione uma Loja</option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                            {store.name} {store.number}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Marca"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="datetime-local"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="form-input-text"
                    required
                />

                <button type="submit" className="form-button">
                    Cadastrar
                </button>
            </form>

            <h3 className="form-title">Lista de Visitas</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Promotor</th>
                        <th>Loja</th>
                        <th>Marca</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    {visits.map((visit) => (
                        <tr key={visit.id}>
                            <td>{visit.promoter}</td>
                            <td>{visit.store}</td>
                            <td>{visit.brand}</td>
                            <td>
                                {new Date(visit.visit_date).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default VisitForm;
