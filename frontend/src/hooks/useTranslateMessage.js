import { useState } from "react";

const useTranslateMessage = () => {
    const [isLoading, setIsLoading] = useState(false);

    const translateMessage = async (message) => {
        if (!message) return "";
        setIsLoading(true);
        try {
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
                    message
                )}&langpair=en|pt`
            );
            const data = await response.json();
            setIsLoading(false);
            let translatedText = data.responseData.translatedText || message;

            translatedText =
                translatedText.charAt(0).toUpperCase() + translatedText.slice(1);

            return translatedText;
        } catch (error) {
            console.error("Erro na tradução:", error);
            setIsLoading(false);
            return message.charAt(0).toUpperCase() + message.slice(1);
        }
    };

    return { translateMessage, isLoading };
};

export default useTranslateMessage;
