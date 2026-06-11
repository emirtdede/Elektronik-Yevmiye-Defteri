import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationTR from './locales/tr.json';
import translationEN from './locales/en.json';
import translationZH from './locales/zh.json';
import translationES from './locales/es.json';
import translationFR from './locales/fr.json';
import translationAR from './locales/ar.json';
import translationHI from './locales/hi.json';
import translationRU from './locales/ru.json';
import translationPT from './locales/pt.json';
import translationDE from './locales/de.json';
import translationSV from './locales/sv.json';
import translationNO from './locales/no.json';
import translationDA from './locales/da.json';
import translationPL from './locales/pl.json';
import translationIT from './locales/it.json';
import translationNL from './locales/nl.json';
import translationCS from './locales/cs.json';
import translationJA from './locales/ja.json';
import translationKO from './locales/ko.json';

const resources = {
  tr: { translation: translationTR },
  en: { translation: translationEN },
  zh: { translation: translationZH },
  es: { translation: translationES },
  fr: { translation: translationFR },
  ar: { translation: translationAR },
  hi: { translation: translationHI },
  ru: { translation: translationRU },
  pt: { translation: translationPT },
  de: { translation: translationDE },
  sv: { translation: translationSV },
  no: { translation: translationNO },
  da: { translation: translationDA },
  pl: { translation: translationPL },
  it: { translation: translationIT },
  nl: { translation: translationNL },
  cs: { translation: translationCS },
  ja: { translation: translationJA },
  ko: { translation: translationKO }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
