import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';
import TagInput from './ui/TagInput';
import ConfirmationModal from './ui/ConfirmationModal';
import CustomDatePicker from './ui/CustomDatePicker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CashRegister = () => {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('LALEPERDE');
  const [companyLogo, setCompanyLogo] = useState('');
  
  // Rapor State
  const today = new Date();
  const [reportDate, setReportDate] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [reportData, setReportData] = useState(null);

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    trans_date: new Date().toISOString().split('T')[0],
    type: 'Nakit Girişi', // 'Nakit Girişi' | 'Nakit Çıkışı'
    amount: '',
    description: ''
  });
  const [cashTags, setCashTags] = useState([]);

  // Confirmation Modal State
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const fetchCashData = async () => {
    if (window.api) {
      setLoading(true);
      const data = await window.api.db.read('cash_register');
      const settings = await window.api.db.read('app_settings');
      
      const cName = settings.find(s => s.setting_key === 'company_name')?.setting_value;
      const cLogo = settings.find(s => s.setting_key === 'company_logo')?.setting_value;
      if (cName) setCompanyName(cName);
      if (cLogo) setCompanyLogo(cLogo);
      
      let total = 0;
      data.forEach(t => {
        if (t.type === 'Nakit Girişi') total += t.amount;
        else if (t.type === 'Nakit Çıkışı') total -= t.amount;
      });
      
      setBalance(total);
      setTransactions(data);
      
      fetchReportData(reportDate.year, reportDate.month);
      
      setLoading(false);
    }
  };

  const fetchReportData = async (year, month) => {
    if (window.api) {
      const res = await window.api.finance.companyReport(year, month);
      if (res.success) {
        setReportData(res);
      }
    }
  };

  useEffect(() => {
    fetchCashData();
  }, []);

  useEffect(() => {
    fetchReportData(reportDate.year, reportDate.month);
  }, [reportDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window.api && formData.amount > 0) {
      const dataToSave = { ...formData, tags: JSON.stringify(cashTags) };
      await window.api.db.create('cash_register', dataToSave);
      setFormData(prev => ({ ...prev, amount: '', description: '' }));
      setCashTags([]);
      fetchCashData();
    }
  };

  const handleDelete = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Kasa İşlemini Sil',
      message: 'Bu kasa işlemini silmek istediğinize emin misiniz? Bu işlem kasa bakiyesini kalıcı olarak etkileyecektir.',
      onConfirm: async () => {
        await window.api.db.delete('cash_register', id);
        fetchCashData();
      }
    });
  };

  if (loading) {
    return <div className="text-center"><div className="loading-spinner"></div></div>;
  }

  const isPositive = balance >= 0;

  const filteredTransactions = transactions.filter(t => {
    let matchStart = true;
    let matchEnd = true;
    let matchType = true;
    
    if (filterStartDate) matchStart = t.trans_date >= filterStartDate;
    if (filterEndDate) matchEnd = t.trans_date <= filterEndDate;
    if (filterType) matchType = t.type === filterType;
    
    return matchStart && matchEnd && matchType;
  });

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
    doc.text(toEn(t('cash.title')), pageWidth / 2, textStartY + 10, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Tarih Araligi: ${filterStartDate || 'Tumu'} / ${filterEndDate || 'Tumu'}`, 14, textStartY + 25);
    
    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, textStartY + 30, pageWidth - 28, 20, 3, 3, 'FD');
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Net Kasa Bakiyesi:', 20, textStartY + 42);
    
    doc.setFontSize(14);
    doc.setTextColor(balance >= 0 ? 34 : 239, balance >= 0 ? 197 : 68, balance >= 0 ? 94 : 68);
    doc.text(`${balance} TL`, 60, textStartY + 42);

    // Table
    const tableColumn = ["Tarih", "Islem Turu", "Tutar (TL)", "Aciklama"];
    const tableRows = [];

    filteredTransactions.forEach(t_row => {
      const rowData = [
        t_row.trans_date,
        toEn(t_row.type),
        `${t_row.amount} TL`,
        toEn(t_row.description || '-')
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: textStartY + 60,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 20 }
    });

    doc.save(`${toEn(companyName)}_Kasa_Raporu.pdf`);
  };

  const handleExport = (format) => {
    const dataToExport = filteredTransactions.map(t_row => ({
      [t('cash.table.date')]: t_row.trans_date,
      [t('cash.table.type')]: t_row.type,
      [t('cash.table.desc')]: t_row.description || '-',
      [t('cash.table.amount')]: t_row.amount
    }));

    if (format === 'excel') exportToExcel(dataToExport, t('cash.title'));
    if (format === 'csv') exportToCSV(dataToExport, t('cash.title'));
    if (format === 'json') exportToJSON(dataToExport, t('cash.title'));
    if (format === 'pdf') generatePDF();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="header" style={{ marginBottom: '2rem' }}>
        <h2>{t('cash.title')}</h2>
      </header>

      <div className="profile-grid">
        {/* Left Column: Balance, Report & Form */}
        <div className="left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Balance */}
          <div className="glass-card balance-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 className="card-subtitle">{t('cash.net_balance')}</h3>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              marginTop: '0.5rem',
              color: isPositive ? 'var(--success-text)' : 'var(--danger-text)',
              textShadow: isPositive ? 'var(--success-shadow)' : 'var(--danger-shadow)'
            }}>
              {balance} ₺
            </div>
          </div>

        {/* Company Monthly Summary */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title">{t('cash.monthly_summary')}</h3>
              <CustomDatePicker
                showMonthYearPicker
                style={{ width: '12rem' }}
                value={`${reportDate.year}-${reportDate.month.toString().padStart(2, '0')}`}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split('-');
                    setReportDate({ year: parseInt(y), month: parseInt(m) });
                  }
                }}
              />
            </div>
            
            {reportData ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--accent-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('cash.wage_cost')}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{reportData.summary.totalWageCost} ₺</div>
                </div>
                <div style={{ background: 'var(--success-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--success-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('cash.monthly_in')}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success-text)' }}>{reportData.summary.totalCashIn} ₺</div>
                </div>
                <div style={{ background: 'var(--danger-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--danger-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('cash.monthly_out')}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger-text)' }}>{reportData.summary.totalCashOut} ₺</div>
                </div>
                <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('cash.net_change')}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: reportData.summary.netCashFlow >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                    {reportData.summary.netCashFlow > 0 ? '+' : ''}{reportData.summary.netCashFlow} ₺
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center"><div className="loading-spinner"></div></div>
            )}
          </div>

          <div className="glass-card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Yeni Nakit İşlemi</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('cash.table.date')}</label>
                <CustomDatePicker name="trans_date" className="form-input" value={formData.trans_date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('cash.table.type')}</label>
                <select name="type" className="form-input" value={formData.type} onChange={handleChange} required>
                  <option value="Nakit Girişi">{t('cash.table.income')} (+)</option>
                  <option value="Nakit Çıkışı">{t('cash.table.expense')} (-)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('cash.table.amount')} (₺)</label>
                <input type="number" name="amount" className="form-input" min="1" step="0.01" value={formData.amount} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('cash.table.desc')}</label>
                <input type="text" name="description" className="form-input" value={formData.description} onChange={handleChange} placeholder={t('cash.desc_ph')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Etiketler</label>
                <TagInput tags={cashTags} setTags={setCashTags} placeholder={t('cash.tags_ph')} />
              </div>
              <button 
                type="submit" 
                className={`btn ${formData.type === 'Nakit Girişi' ? 'btn-primary' : 'btn-danger'}`} 
                style={{ width: '100%' }}
              >
                {formData.type === 'Nakit Girişi' ? t('cash.add_in') : t('cash.add_out')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="right-panel glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>{t('cash.cash_history')}</h3>
            <select className="btn" style={{ padding: '0.5rem' }} onChange={e => handleExport(e.target.value)} value="">
              <option value="" disabled>{t('group_report.export')}...</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('cash.start_date')}</label>
              <CustomDatePicker className="form-input" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('cash.end_date')}</label>
              <CustomDatePicker className="form-input" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('cash.trans_dir')}</label>
              <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">{t('cash.all')}</option>
                <option value="Nakit Girişi">{t('cash.table.income')}</option>
                <option value="Nakit Çıkışı">{t('cash.table.expense')}</option>
              </select>
            </div>
          </div>
          
          {filteredTransactions.length === 0 ? (
            <p className="text-muted text-center" style={{ marginTop: '2rem' }}>{t('common.empty_data') || 'Veri bulunmuyor.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '800px', overflowY: 'auto', paddingRight: '10px' }}>
              {filteredTransactions.map(tr => {
                const isIncome = tr.type === 'Nakit Girişi';
                return (
                  <div key={tr.id} style={{ 
                    background: isIncome ? 'var(--success-bg-light)' : 'var(--danger-bg-light)', 
                    border: `1px solid ${isIncome ? 'var(--success-border)' : 'var(--danger-border)'}`, 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{tr.trans_date}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          border: `1px solid var(${isIncome ? '--success-text' : '--danger-text'})`,
                          color: `var(${isIncome ? '--success-text' : '--danger-text'})`
                        }}>{isIncome ? t('cash.table.income') : t('cash.table.expense')}</span>
                      </div>
                      <div className="card-subtitle" style={{ fontSize: '0.9rem' }}>
                        {tr.description || '-'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: isIncome ? 'var(--success-text)' : 'var(--danger-text)', fontSize: '1.1rem' }}>
                        {isIncome ? '+' : '-'}{tr.amount} ₺
                      </div>
                      <button 
                        onClick={() => handleDelete(tr.id)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger-text)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.25rem' }}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        message={confirmModalState.message}
      />
    </div>
  );
};

export default CashRegister;
