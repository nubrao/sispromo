import { useState, useEffect } from "react";
import promoterRepository from "../repositories/promoterRepository";

export const usePromoterList = () => {
    const [promoters, setPromoters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPromoters = async () => {
        setLoading(true);
        try {
            const data = await promoterRepository.getAllPromoters();
            setPromoters(data);
            setError(null);
        } catch (err) {
            setError(err);
            console.error("Erro ao buscar promotores:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromoters();

        // Escuta o evento de usuário excluído
        const handleUserDeleted = () => {
            fetchPromoters();
        };

        window.addEventListener("userDeleted", handleUserDeleted);

        return () => {
            window.removeEventListener("userDeleted", handleUserDeleted);
        };
    }, []);

    return {
        promoters,
        loading,
        error,
        refreshPromoters: fetchPromoters
    };
}; 