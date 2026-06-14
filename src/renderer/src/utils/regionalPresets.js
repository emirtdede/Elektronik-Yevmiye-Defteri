/**
 * Static localization presets mapping for offline-first O(1) retrieval.
 * Keyed by language/locale identifiers.
 */
export const REGIONAL_PRESETS = {
  tr: { currency: 'TRY', dateFormat: 'DD.MM.YYYY', timeFormat: '24h', timezone: 'GMT+3' },
  'en-GB': { currency: 'GBP', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', timezone: 'GMT+0' },
  'en-US': { currency: 'USD', dateFormat: 'MM/DD/YYYY', timeFormat: '12h', timezone: 'GMT-5' },
  en: { currency: 'USD', dateFormat: 'MM/DD/YYYY', timeFormat: '12h', timezone: 'GMT-5' }, // Default for English
  zh: { currency: 'CNY', dateFormat: 'YYYY/MM/DD', timeFormat: '24h', timezone: 'GMT+8' },
  es: { currency: 'EUR', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  fr: { currency: 'EUR', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  de: { currency: 'EUR', dateFormat: 'DD.MM.YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  it: { currency: 'EUR', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  nl: { currency: 'EUR', dateFormat: 'DD-MM-YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  pt: { currency: 'EUR', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', timezone: 'GMT+0' },
  ru: { currency: 'RUB', dateFormat: 'DD.MM.YYYY', timeFormat: '24h', timezone: 'GMT+3' },
  ja: { currency: 'JPY', dateFormat: 'YYYY/MM/DD', timeFormat: '24h', timezone: 'GMT+9' },
  ko: { currency: 'KRW', dateFormat: 'YYYY.MM.DD', timeFormat: '24h', timezone: 'GMT+9' },
  ar: { currency: 'SAR', dateFormat: 'DD/MM/YYYY', timeFormat: '12h', timezone: 'GMT+3' },
  hi: { currency: 'INR', dateFormat: 'DD-MM-YYYY', timeFormat: '12h', timezone: 'GMT+5:30' },
  sv: { currency: 'SEK', dateFormat: 'YYYY-MM-DD', timeFormat: '24h', timezone: 'GMT+1' },
  no: { currency: 'NOK', dateFormat: 'DD.MM.YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  da: { currency: 'DKK', dateFormat: 'DD.MM.YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  pl: { currency: 'PLN', dateFormat: 'DD.MM.YYYY', timeFormat: '24h', timezone: 'GMT+1' },
  cs: { currency: 'CZK', dateFormat: 'DD.MM.YYYY', timeFormat: '24h', timezone: 'GMT+1' }
};

const DEFAULT_PRESET = REGIONAL_PRESETS.tr;

/**
 * Returns the localization preset for a given language code in O(1) time.
 * @param {string} lang - Language code (e.g., 'tr', 'en-US')
 * @returns {object} Preset containing currency, dateFormat, timeFormat, timezone
 */
export const getRegionalPreset = (lang) => {
  if (!lang) return DEFAULT_PRESET;
  return REGIONAL_PRESETS[lang] || REGIONAL_PRESETS[lang.split('-')[0]] || DEFAULT_PRESET;
};
