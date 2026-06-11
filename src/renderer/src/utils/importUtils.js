import * as XLSX from 'xlsx';
import { isValidTCKN } from './validation.js';

/**
 * Excel dosyasını okur ve JSON olarak döndürür
 * Beklenen Sütunlar: Ad Soyad, TC Kimlik No, Telefon, Günlük Yevmiye (TL)
 */
export const readWorkersFromExcel = (file, t) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // İlk sayfayı al
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON'a çevir
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        const parsedWorkers = [];
        const errors = [];

        json.forEach((row, index) => {
          // Normalize keys (handle spaces and case)
          const normalizedRow = {};
          for (let key in row) {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          }

          // Ad Soyad (Zorunlu)
          const fullName = normalizedRow[String(t('about.col_name')).toLowerCase()] || normalizedRow['ad soyad'] || normalizedRow['ad'] || normalizedRow['isim'] || '';
          if (!fullName) {
            errors.push(t('about.err_name_empty').replace('{line}', index + 2));
            return;
          }

          // TC No (Opsiyonel ama varsa geçerli olmalı)
          const tcNo = String(normalizedRow[String(t('about.col_tc')).toLowerCase()] || normalizedRow['tc kimlik no'] || normalizedRow['tc no'] || normalizedRow['tc'] || '').trim();
          if (tcNo && !isValidTCKN(tcNo)) {
            errors.push(t('about.err_tc_invalid').replace('{line}', index + 2).replace('{tc}', tcNo));
            return;
          }

          // Telefon
          const phone = String(normalizedRow[String(t('about.col_phone')).toLowerCase()] || normalizedRow['telefon'] || normalizedRow['tel'] || '').trim();

          // Günlük Yevmiye
          const rawWage = normalizedRow[String(t('about.col_wage')).toLowerCase()] || normalizedRow['günlük yevmiye (tl)'] || normalizedRow['günlük yevmiye'] || normalizedRow['yevmiye'] || normalizedRow['wage'] || '';
          let dailyWage = 0;
          if (rawWage) {
            const num = Number(String(rawWage).replace(',', '.'));
            if (!isNaN(num)) dailyWage = num;
          }

          parsedWorkers.push({
            full_name: fullName.trim(),
            tc_no: tcNo,
            phone: phone,
            daily_wage: dailyWage,
            group_id: null,
            start_date: new Date().toISOString().split('T')[0],
            status: 'active',
            tags: '[]'
          });
        });

        if (errors.length > 0) {
          reject({ success: false, message: t('about.err_excel_errors') + '\n' + errors.join('\n') });
        } else {
          resolve({ success: true, data: parsedWorkers });
        }

      } catch (err) {
        reject({ success: false, message: t('about.err_excel_read').replace('{err}', err.message) });
      }
    };

    reader.onerror = () => {
      reject({ success: false, message: t('about.err_file_read') });
    };

    reader.readAsArrayBuffer(file);
  });
};
