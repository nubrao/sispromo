import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'pt-BR',
        supportedLngs: ['pt-BR'],
        load: 'currentOnly',
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false,
        },
        ns: ['common', 'auth', 'validation', 'errors', 'stores', 'brands', 'promoters', 'visits', 'users'],
        defaultNS: 'common',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        locales: ['pt-BR'],
    });


export default i18n; 