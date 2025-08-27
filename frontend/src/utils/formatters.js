export const formatCPF = (value) => {
    const cleaned = cleanNumber(value);
    if (!cleaned) return "";

    // Aplica a máscara do CPF (000.000.000-00)
    return cleaned
        .slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatCNPJ = (value) => {
    const cleaned = cleanNumber(value);
    if (!cleaned) return "";

    // Aplica a máscara do CNPJ (00.000.000/0000-00)
    return cleaned
        .slice(0, 14)
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export const formatPhone = (value) => {
    const cleaned = cleanNumber(value);
    if (!cleaned) return "";

    // Aplica a máscara do telefone ((00) 00000-0000)
    if (cleaned.length <= 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return cleaned
        .slice(0, 11)
        .replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

export const cleanNumber = (value) => {
    return value?.replace(/\D/g, "") || "";
}; 