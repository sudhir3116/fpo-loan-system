import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ta from './locales/ta.json';

const savedLanguage = localStorage.getItem('fpo_admin_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta'],
    interpolation: {
      escapeValue: false, // React handles escaping natively
    },
  });

// Keep localStorage in sync whenever the language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('fpo_admin_language', lng);
});

export default i18n;
