import * as XLSX from 'xlsx';

/**
 * Verilen JSON dizisini Excel (.xlsx) formatında dışa aktarır.
 * @param {Array} data Dışa aktarılacak veri dizisi
 * @param {string} filename İndirilecek dosya adı (uzantısız)
 */
export const exportToExcel = (data, filename) => {
  if (!data || !data.length) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Veri');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Verilen JSON dizisini CSV (.csv) formatında dışa aktarır.
 * @param {Array} data Dışa aktarılacak veri dizisi
 * @param {string} filename İndirilecek dosya adı (uzantısız)
 */
export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Create blob and download (UTF-8 BOM added for Excel compatibility)
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Verilen JSON dizisini doğrudan JSON (.json) formatında dışa aktarır.
 * @param {Array} data Dışa aktarılacak veri dizisi
 * @param {string} filename İndirilecek dosya adı (uzantısız)
 */
export const exportToJSON = (data, filename) => {
  if (!data || !data.length) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToText = (lines, filename) => {
  if (!lines || !lines.length) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }
  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.txt`;
  link.click();
};

export const exportToMarkdown = (lines, filename) => {
  if (!lines || !lines.length) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }
  const content = `# ${filename}\n\n` + lines.map(l => `- ${l}`).join('\n');
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.md`;
  link.click();
};

export const generateExcelTemplate = (t) => {
  const headers = [
    t('about.col_name'),
    t('about.col_tc'),
    t('about.col_phone'),
    t('about.col_wage')
  ];
  
  const tips = [
    t('about.tip_name'),
    t('about.tip_tc'),
    t('about.tip_phone'),
    t('about.tip_wage')
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, tips]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Personel Taslak');
  XLSX.writeFile(workbook, 'Personel_İçe_Aktarma_Taslağı.xlsx');
};
