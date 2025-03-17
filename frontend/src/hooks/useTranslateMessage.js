import { pt_BR } from '../translations/pt_BR';

export const useTranslateMessage = () => {
    const translateMessage = (message) => {
        if (!message) return "";

        // Tenta encontrar a tradução no objeto de traduções
        const translation = message.split('.').reduce((obj, key) => obj?.[key], pt_BR);

        // Se encontrar a tradução, retorna ela, senão retorna a mensagem original
        return translation || message;
    };

    return { translateMessage };
};
