export const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Verifica se a data é válida
    if (isNaN(date.getTime())) return "";

    // Ajusta para o fuso horário local e formata para dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

// Função para formatar data e hora
export const formatDateTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Verifica se a data é válida
    if (isNaN(date.getTime())) return "";

    // Formata para dd/mm/yyyy HH:mm
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Função para converter data do formato brasileiro para ISO
export const convertToISODate = (dateString) => {
    if (!dateString) return "";

    // Verifica se a data está no formato dd/mm/yyyy
    const parts = dateString.split("/");
    if (parts.length !== 3) return "";

    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    // Cria uma data no formato ISO (yyyy-mm-dd)
    return `${year}-${month}-${day}`;
}; 