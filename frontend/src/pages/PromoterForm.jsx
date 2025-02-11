import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css"; // 🔹 Importação do CSS

const PromoterForm = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [promoters, setPromoters] = useState([]);

    useEffect(() => {
        fetchPromoters();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://127.0.0.1:8000/api/promoters/", {
                name,
                email,
                phone,
            });
            fetchPromoters();
            setName("");
            setEmail("");
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
                    className="form-input"
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    required
                />
                <input
                    type="text"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
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
                        <th>Email</th>
                        <th>Telefone</th>
                    </tr>
                </thead>
                <tbody>
                    {promoters.map((promoter) => (
                        <tr key={promoter.id}>
                            <td>{promoter.name}</td>
                            <td>{promoter.email}</td>
                            <td>{promoter.phone}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PromoterForm;
