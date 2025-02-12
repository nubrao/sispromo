import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";

const PromoterForm = () => {
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [promoters, setPromoters] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchPromoters();
    }, []);

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            setPromoters(response.data);
        } catch (error) {
            console.error("Error fetching promoters", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/token/`, {
                name,
                cpf,
                phone,
            });
            fetchPromoters();
            setName("");
            setCpf("");
            setPhone("");
        } catch (error) {
            console.error("Error creating promoter", error);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Cadastro de Promotores</h2>
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
                    placeholder="CPF"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="form-input-text"
                    required
                />
                <input
                    type="text"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input-text"
                    required
                />
                <button type="submit" className="form-button">
                    Cadastrar
                </button>
            </form>

            <h3 className="form-title">Lista de Promotores</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>Telefone</th>
                    </tr>
                </thead>
                <tbody>
                    {promoters.map((promoter) => (
                        <tr key={promoter.id}>
                            <td>{promoter.name}</td>
                            <td>{promoter.cpf}</td>
                            <td>{promoter.phone}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PromoterForm;
