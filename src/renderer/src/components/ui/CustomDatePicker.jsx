import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';
import { tr, enUS, de, fr, es, zhCN, ru, ja, ko, it, nl, pt, arSA, hi, sv, nb, da, pl, cs } from 'date-fns/locale';

registerLocale('tr', tr);
registerLocale('en', enUS);
registerLocale('de', de);
registerLocale('fr', fr);
registerLocale('es', es);
registerLocale('zh', zhCN);
registerLocale('ru', ru);
registerLocale('ja', ja);
registerLocale('ko', ko);
registerLocale('it', it);
registerLocale('nl', nl);
registerLocale('pt', pt);
registerLocale('ar', arSA);
registerLocale('hi', hi);
registerLocale('sv', sv);
registerLocale('no', nb);
registerLocale('da', da);
registerLocale('pl', pl);
registerLocale('cs', cs);

const CustomDatePicker = ({ value, onChange, className, required, style, name, placeholder, showMonthYearPicker }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'tr';

  const [date, setDate] = useState(null);

  useEffect(() => {
    // Prevent timezone shift by parsing local parts
    if (value) {
      const parts = value.split('-');
      if (showMonthYearPicker) {
        if (parts.length >= 2) {
          setDate(new Date(parts[0], parts[1] - 1, 1));
        } else {
          setDate(new Date(value));
        }
      } else {
        if (parts.length === 3) {
          setDate(new Date(parts[0], parts[1] - 1, parts[2]));
        } else {
          setDate(new Date(value));
        }
      }
    } else {
      setDate(null);
    }
  }, [value, showMonthYearPicker]);

  const handleChange = (selectedDate) => {
    setDate(selectedDate);
    if (onChange) {
      if (showMonthYearPicker) {
        const yyyy = selectedDate ? selectedDate.getFullYear() : '';
        const mm = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '';
        const finalVal = selectedDate ? `${yyyy}-${mm}` : '';

        onChange({
          target: {
            name: name || '',
            value: finalVal
          }
        });
      } else {
        // Extract YYYY-MM-DD
        const yyyy = selectedDate ? selectedDate.getFullYear() : '';
        const mm = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '';
        const dd = selectedDate ? String(selectedDate.getDate()).padStart(2, '0') : '';
        const finalVal = selectedDate ? `${yyyy}-${mm}-${dd}` : '';

        onChange({
          target: {
            name: name || '',
            value: finalVal
          }
        });
      }
    }
  };

  const getDateFormat = () => {
    if (showMonthYearPicker) return 'MMMM yyyy';
    if (lang === 'en') return 'MM/dd/yyyy';
    if (['tr', 'de', 'fr', 'it', 'es', 'pt', 'ru', 'nl', 'cs', 'da', 'no', 'pl', 'sv'].includes(lang)) return 'dd.MM.yyyy';
    if (['zh', 'ja', 'ko'].includes(lang)) return 'yyyy-MM-dd';
    // default
    return 'yyyy-MM-dd';
  };

  return (
    <div style={{ width: '100%', position: 'relative', display: 'flex', ...style }} className="custom-datepicker-wrapper">
      <DatePicker
        selected={date}
        onChange={handleChange}
        locale={lang}
        dateFormat={getDateFormat()}
        className={className || "form-input"}
        required={required}
        name={name}
        placeholderText={placeholder || getDateFormat().toLowerCase()}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        autoComplete="off"
        wrapperClassName="w-100"
        showMonthYearPicker={showMonthYearPicker}
      />
    </div>
  );
};

export default CustomDatePicker;
