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
  
  let selectedCurrency = config.currency;
  if (window.regionalSettings && window.regionalSettings.currency && window.regionalSettings.currency !== 'auto') {
    selectedCurrency = window.regionalSettings.currency;
  }

  const num = Number(amount) || 0;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: selectedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Formats a date string (YYYY-MM-DD or ISO string) based on regional settings.
 * @param {string|Date} dateVal - The date value to format.
 * @param {string} lang - Fallback language key (e.g., 'tr').
 * @returns {string} The formatted date string.
 */
export const formatDate = (dateVal, lang = 'tr') => {
  if (!dateVal) return '-';
  
  // Safe check for YYYY-MM-DD strings to prevent timezone shifts
  let d;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const parts = dateVal.split('-');
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dateVal);
  }
  
  if (isNaN(d.getTime())) return String(dateVal);

  let formatMode = 'auto';
  if (window.regionalSettings && window.regionalSettings.dateFormat) {
    formatMode = window.regionalSettings.dateFormat;
  }

  if (formatMode === 'auto') {
    const locales = {
      tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
      zh: 'zh-CN', ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR', ar: 'ar-SA',
      hi: 'hi-IN', it: 'it-IT', nl: 'nl-NL', pt: 'pt-PT', sv: 'sv-SE',
      no: 'nb-NO', da: 'da-DK', pl: 'pl-PL', cs: 'cs-CZ'
    };
    const loc = locales[lang] || 'tr-TR';
    return d.toLocaleDateString(loc);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (formatMode === 'DD.MM.YYYY') {
    return `${day}.${month}.${year}`;
  } else if (formatMode === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  } else if (formatMode === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  } else if (formatMode === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  } else if (formatMode === 'DD-MM-YYYY') {
    return `${day}-${month}-${year}`;
  } else if (formatMode === 'YYYY/MM/DD') {
    return `${year}/${month}/${day}`;
  } else if (formatMode === 'YYYY.MM.DD') {
    return `${year}.${month}.${day}`;
  }

  return d.toLocaleDateString('tr-TR');
};

/**
 * Formats a time or date-time string to time based on regional settings.
 * @param {string|Date} dateTimeVal - The date-time value.
 * @param {string} lang - Fallback language.
 * @returns {string} Formatted time.
 */
export const formatTime = (dateTimeVal, lang = 'tr') => {
  if (!dateTimeVal) return '-';
  const d = new Date(dateTimeVal);
  if (isNaN(d.getTime())) {
    if (typeof dateTimeVal === 'string' && dateTimeVal.includes(':')) {
      const parts = dateTimeVal.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        d.setHours(hours);
        d.setMinutes(minutes);
      } else {
        return dateTimeVal;
      }
    } else {
      return String(dateTimeVal);
    }
  }

  let formatMode = 'auto';
  if (window.regionalSettings && window.regionalSettings.timeFormat) {
    formatMode = window.regionalSettings.timeFormat;
  }

  if (formatMode === 'auto') {
    const locales = {
      tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
      zh: 'zh-CN', ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR', ar: 'ar-SA',
      hi: 'hi-IN', it: 'it-IT', nl: 'nl-NL', pt: 'pt-PT', sv: 'sv-SE',
      no: 'nb-NO', da: 'da-DK', pl: 'pl-PL', cs: 'cs-CZ'
    };
    const loc = locales[lang] || 'tr-TR';
    return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  }

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (formatMode === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  } else if (formatMode === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Returns the active currency symbol based on system config or selected language.
 * @param {string} lang - Language code.
 * @returns {string} Currency symbol (e.g. '₺', '$', '€').
 */
export const getCurrencySymbol = (lang = 'tr') => {
  const currencyMap = {
    tr: 'TRY', en: 'USD', zh: 'CNY', es: 'EUR', fr: 'EUR', de: 'EUR', it: 'EUR', nl: 'EUR', pt: 'EUR',
    ru: 'RUB', ja: 'JPY', ko: 'KRW', ar: 'SAR', hi: 'INR', sv: 'SEK', no: 'NOK', da: 'DKK', pl: 'PLN', cs: 'CZK'
  };

  let selectedCurrency = currencyMap[lang] || 'TRY';
  if (window.regionalSettings && window.regionalSettings.currency && window.regionalSettings.currency !== 'auto') {
    selectedCurrency = window.regionalSettings.currency;
  }

  const symbolMap = {
    TRY: '₺', USD: '$', EUR: '€', GBP: '£', CNY: '¥', JPY: '¥', KRW: '₩', RUB: '₽',
    SAR: 'SR', AED: 'د.إ', EGP: 'ج.م', INR: '₹', BRL: 'R$', SEK: 'kr', NOK: 'kr',
    DKK: 'kr', PLN: 'zł', CZK: 'Kč'
  };

  return symbolMap[selectedCurrency] || selectedCurrency;
};

