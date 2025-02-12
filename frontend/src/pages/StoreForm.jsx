import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";

const StoreForm = () => {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [stores, setStores] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stores/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            setStores(response.data);
        } catch (error) {
            console.error("Error fetching stores", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/token/`, {
                name,
                number,
                city,
                district,
                cnpj,
            });
            fetchStores();
            setName("");
            setNumber("");
            setCity("");
            setDistrict("");
            setCnpj("");
        } catch (error) {
            console.error("Error creating store", error);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Lojas</h2>
            <form onSubmit={handleSubmit} className="form-input">
                <input
                    type="text"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="text"
                    placeholder="Número"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="text"
                    placeholder="Cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="text"
                    placeholder="Estado"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="text"
                    placeholder="CNPJ"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="form-input-text"
                    required
                />
                <button type="submit" className="form-button">
                    Cadastrar
                </button>
            </form>

            <h3 className="form-title">Lista de Lojas</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Numero</th>
                        <th>Cidade</th>
                        <th>Estado</th>
                        <th>CNPJ</th>
                    </tr>
                </thead>
                <tbody>
                    {stores.map((store) => (
                        <tr key={store.id}>
                            <td>{store.name}</td>
                            <td>{store.number}</td>
                            <td>{store.city}</td>
                            <td>{store.district}</td>
                            <td>{store.cnpj}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StoreForm;
