import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import taTranslations from './locales/ta.json';

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('fpo_admin_language') : null;
const defaultLanguage = savedLanguage === 'ta' ? 'ta' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ta: { translation: taTranslations },
    },
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Keep localStorage synchronized whenever language is changed
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fpo_admin_language', lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
