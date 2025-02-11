import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css"; // 🔹 Importação do CSS

const StoreForm = () => {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [stores, setStores] = useState([]);

    useEffect(() => {
        fetchStores();
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://127.0.0.1:8000/api/stores/", {
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
                    className="form-input"
                    required
                />
                <input
                    type="text"
                    placeholder="Número"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="form-input"
                    required
                />
                <input
                    type="text"
                    placeholder="Cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    required
                />
                <input
                    type="text"
                    placeholder="Bairro"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="form-input"
                    required
                />
                <input
                    type="text"
                    placeholder="CNPJ"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="form-input"
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
                        <th>Bairro</th>
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
