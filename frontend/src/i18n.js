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
        lng: "pt-BR",
        supportedLngs: ["pt-BR"],
        load: "currentOnly",
        debug: false,
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
        },
        react: {
            useSuspense: false
        },
        detection: {
            order: ["querystring", "localStorage"],
            lookupQuerystring: "lng",
            caches: ["localStorage"],
            checkWhitelist: true
        },
        whitelist: ["pt-BR"]
    });

// Força o idioma para pt-BR
i18n.changeLanguage("pt-BR");

export default i18n; 