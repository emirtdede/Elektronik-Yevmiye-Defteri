/**
 * Formats a number as a currency string based on the selected language.
 * @param {number} amount - The numeric value to format.
 * @param {string} lang - The language key (e.g., 'tr', 'en').
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount, lang = 'tr') => {
  const currencyMap = {
    tr: { locale: 'tr-TR', currency: 'TRY' },
    en: { locale: 'en-US', currency: 'USD' },
    zh: { locale: 'zh-CN', currency: 'CNY' },
    es: { locale: 'es-ES', currency: 'EUR' },
    fr: { locale: 'fr-FR', currency: 'EUR' },
    de: { locale: 'de-DE', currency: 'EUR' },
    it: { locale: 'it-IT', currency: 'EUR' },
    nl: { locale: 'nl-NL', currency: 'EUR' },
    pt: { locale: 'pt-PT', currency: 'EUR' },
    ru: { locale: 'ru-RU', currency: 'RUB' },
    ja: { locale: 'ja-JP', currency: 'JPY' },
    ko: { locale: 'ko-KR', currency: 'KRW' },
    ar: { locale: 'ar-SA', currency: 'SAR' },
    hi: { locale: 'hi-IN', currency: 'INR' },
    sv: { locale: 'sv-SE', currency: 'SEK' },
    no: { locale: 'nb-NO', currency: 'NOK' },
    da: { locale: 'da-DK', currency: 'DKK' },
    pl: { locale: 'pl-PL', currency: 'PLN' },
    cs: { locale: 'cs-CZ', currency: 'CZK' }
  };

  const config = currencyMap[lang] || { locale: 'tr-TR', currency: 'TRY' };
  
  // Safe check
  const num = Number(amount) || 0;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0, // No decimal if it is integer, or we can keep 2
    maximumFractionDigits: 2
  }).format(num);
};
