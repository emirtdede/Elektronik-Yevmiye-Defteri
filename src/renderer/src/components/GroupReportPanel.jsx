import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const GroupReportPanel = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [companyName, setCompanyName] = useState('LALEPERDE');
  const [companyLogo, setCompanyLogo] = useState('');

  const fetchGroupReport = async () => {
    if (window.api && window.api.finance) {
      setLoading(true);
      const res = await window.api.finance.groupStatement({ start_date: startDate, end_date: endDate });
      if (res.success) {
        setReportData(res.groups);
      } else {
        alert('Rapor alınırken hata oluştu: ' + res.message);
      }
      
      const settings = await window.api.db.read('app_settings');
      const cName = settings.find(s => s.setting_key === 'company_name')?.setting_value;
      const cLogo = settings.find(s => s.setting_key === 'company_logo')?.setting_value;
      if (cName) setCompanyName(cName);
      if (cLogo) setCompanyLogo(cLogo);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupReport();
  }, [startDate, endDate]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const trMap = { 'ç':'c', 'ğ':'g', 'ş':'s', 'ö':'o', 'ü':'u', 'ı':'i', 'Ç':'C', 'Ğ':'G', 'Ş':'S', 'Ö':'O', 'Ü':'U', 'İ':'I' };
    const toEn = (str) => str ? String(str).replace(/[çğşöüıÇĞŞÖÜİ]/g, letter => trMap[letter]) : '';
    
    // Header
    let textStartY = 20;

    if (companyLogo) {
      try {
        doc.addImage(companyLogo, 'PNG', pageWidth / 2 - 15, 10, 30, 15);
        textStartY = 35;
      } catch (err) {
        console.error('Error adding logo to PDF', err);
      }
    }

    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text(toEn(companyName), pageWidth / 2, textStartY, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(toEn(t('group_report.title')), pageWidth / 2, textStartY + 10, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Tarih Araligi: ${startDate || 'Tumu'} / ${endDate || 'Tumu'}`, 14, textStartY + 25);
    
    // Table
    const tableColumn = ["Grup Adi", "Kisi Sayisi", "Bu Donem Hak Edis", "Bu Donem Avans", "Genel Toplam Bakiye"];
    const tableRows = [];

    reportData.forEach(g => {
      const rowData = [
        toEn(g.group_name === 'Grupsuz Personeller' ? t('group_report.no_group') : g.group_name),
        `${g.worker_count}`,
        `${g.period_earned} TL`,
        `${g.period_advance} TL`,
        `${g.absolute_balance} TL`
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: textStartY + 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    doc.save(`${toEn(companyName)}_Grup_Raporu.pdf`);
  };

  const handleExport = (format) => {
    const dataToExport = reportData.map(g => ({
      'Grup Adı': g.group_name === 'Grupsuz Personeller' ? t('group_report.no_group') : g.group_name,
      'Kişi Sayısı': g.worker_count,
      'Bu Dönem Hak Ediş (TL)': g.period_earned,
      'Bu Dönem Avans/Ödeme (TL)': g.period_advance,
      'Genel Toplam Bakiye (TL)': g.absolute_balance
    }));

    if (format === 'excel') exportToExcel(dataToExport, `Grup_Raporu_${startDate}_${endDate}`);
    if (format === 'json') exportToJSON(dataToExport, `Grup_Raporu_${startDate}_${endDate}`);
    if (format === 'pdf') generatePDF();
  };

  if (loading) {
    return (
      <div className="glass-card text-center" style={{ marginBottom: '2rem' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (reportData.length === 0) {
    return null; // Return nothing if no data to show
  }

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: 0 }}>{t('group_report.title')}</h3>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{t('group_report.start_date')}</label>
            <input type="date" className="form-input" style={{ padding: '0.25rem 0.5rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{t('group_report.end_date')}</label>
            <input type="date" className="form-input" style={{ padding: '0.25rem 0.5rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <select className="btn" style={{ padding: '0.5rem', alignSelf: 'flex-end', height: '100%', marginBottom: '2px' }} onChange={e => {
              if(e.target.value) handleExport(e.target.value);
              e.target.value = '';
            }} value="">
            <option value="" disabled>{t('group_report.export')}</option>
            <option value="pdf">PDF (.pdf)</option>
            <option value="excel">Excel (.xlsx)</option>
            <option value="json">JSON (.json)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {reportData.map(group => {
          const isPositive = group.new_balance >= 0;
          return (
            <div key={group.group_id} style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '8px', 
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{group.group_name === 'Grupsuz Personeller' ? t('group_report.no_group') : group.group_name}</h4>
                <span style={{ fontSize: '0.8rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                  {group.worker_count} {t('group_report.person_count')}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('group_report.period')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <span>{t('group_report.earned')}</span>
                    <span style={{ color: '#34d399' }}>+{group.period_earned} ₺</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <span>{t('group_report.advance')}</span>
                    <span style={{ color: '#ef4444' }}>-{group.period_advance} ₺</span>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('group_report.total_balance')}</div>
                  <div style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 'bold', 
                    color: group.absolute_balance >= 0 ? '#34d399' : '#ef4444' 
                  }}>
                    {group.absolute_balance} ₺
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupReportPanel;
