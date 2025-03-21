import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "pt-BR",
        debug: process.env.NODE_ENV === "development",
        ns: [
            "common",
            "auth",
            "brands",
            "dashboard",
            "promoters",
            "reports",
            "stores",
            "users",
            "visitPrices",
            "visits"
        ],
        defaultNS: "common",
        interpolation: {
            escapeValue: false
        },
        backend: {
            loadPath: "/locales/{{lng}}/{{ns}}.json"
        }
    });

export default i18n; 