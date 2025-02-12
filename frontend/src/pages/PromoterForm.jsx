import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/form.css";
import { formatCPF, formatPhone } from "../hooks/useMask";
import useTranslateMessage from "../hooks/useTranslateMessage";

const PromoterForm = () => {
    const [name, setName] = useState("");
    const [cpf, setCPF] = useState("");
    const [phone, setPhone] = useState("");
    const [promoters, setPromoters] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");
    const { translateMessage } = useTranslateMessage();

    useEffect(() => {
        fetchPromoters();
    }, []);

    const fetchPromoters = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/promoters/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPromoters(response.data);
        } catch (error) {
            console.error("Error fetching promoters", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        const cleanedCPF = cpf.replace(/\D/g, "");
        const cleanedPhone = phone.replace(/\D/g, "");

        try {
            await axios.post(
                `${API_URL}/api/promoters/`,
                { name, cpf: cleanedCPF, phone: cleanedPhone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPromoters();
            setName("");
            setCPF("");
            setPhone("");
        } catch (error) {
            if (error.response && error.response.status === 400) {
                if (error.response.data.cpf) {
                    const translatedMessage = await translateMessage(
                        error.response.data.cpf[0]
                    );
                    setErrorMessage(translatedMessage);
                } else {
                    const translatedMessage = await translateMessage(
                        "Erro ao cadastrar promotor. Verifique os dados."
                    );
                    setErrorMessage(translatedMessage);
                }
            } else {
                const translatedMessage = await translateMessage(
                    "Erro ao conectar com o servidor."
                );
                setErrorMessage(translatedMessage);
            }
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
                    onChange={(e) => setCPF(formatCPF(e.target.value))}
                    className="form-input-text"
                    required
                />
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}
                <input
                    type="text"
                    placeholder="Celular"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
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
                        <th>Celular</th>
                    </tr>
                </thead>
                <tbody>
                    {promoters.map((promoter) => (
                        <tr key={promoter.id}>
                            <td>{promoter.name}</td>
                            <td>{formatCPF(promoter.cpf)}</td>
                            <td>{formatPhone(promoter.phone)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PromoterForm;
