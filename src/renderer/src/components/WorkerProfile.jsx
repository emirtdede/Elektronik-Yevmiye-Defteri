import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';
import TagInput from './ui/TagInput';
import ConfirmationModal from './ui/ConfirmationModal';
import CustomDatePicker from './ui/CustomDatePicker';
import { formatCurrency, formatDate, getCurrencySymbol } from '../utils/formatUtils';
import GuideDrawer from './ui/GuideDrawer';

const WorkerProfile = ({ worker, onBack }) => {
  const { t, i18n } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [workTypes, setWorkTypes] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('puantaj'); // 'puantaj' | 'avans' | 'rapor'
  
  // Dinamik Filtre State (Cari Hesap Ekstresi)
  const [filterStartDate, setFilterStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
  const handleStartDateChange = (val) => {
    if (val && filterEndDate && new Date(val) > new Date(filterEndDate)) {
      setFilterStartDate(filterEndDate);
      setFilterEndDate(val);
    } else {
      setFilterStartDate(val);
    }
  };
  const handleEndDateChange = (val) => {
    if (val && filterStartDate && new Date(filterStartDate) > new Date(val)) {
      setFilterEndDate(filterStartDate);
      setFilterStartDate(val);
    } else {
      setFilterEndDate(val);
    }
  };
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('Tümü'); // 'Tümü' | 'Puantaj' | 'Avans'
  
  const [companyName, setCompanyName] = useState('LALEPERDE');
  const [companyLogo, setCompanyLogo] = useState('');
  
  // Form State for Puantaj
  const [formData, setFormData] = useState({
    work_date: new Date().toISOString().split('T')[0],
    work_type_id: '',
    overtime_hours: 0,
    notes: ''
  });
  const [calculatedWage, setCalculatedWage] = useState(0);
  const [puantajTags, setPuantajTags] = useState([]);

  // Form State for Avans
  const [avansData, setAvansData] = useState({
    trans_date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: ''
  });
  const [avansTags, setAvansTags] = useState([]);

  // Confirmation Modal State
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const fetchProfileData = async () => {
    if (window.api && worker) {
      setLoading(true);
      const res = await window.api.finance.getBalance(worker.id);
      if (res.success) setBalance(res.balance);
      
      const wTypes = await window.api.db.read('work_types');
      setWorkTypes(wTypes);
      
      // Select 'Tam Gün' or the one with multiplier 1.0 by default
      if (wTypes && wTypes.length > 0 && !formData.work_type_id) {
        const defaultType = wTypes.find(wt => wt.name === 'Tam Gün') || wTypes.find(wt => wt.multiplier === 1.0) || wTypes[0];
        if (defaultType) {
          setFormData(prev => ({ ...prev, work_type_id: defaultType.id }));
        }
      }

      const settings = await window.api.db.read('app_settings');
      const cName = settings.find(s => s.setting_key === 'company_name')?.setting_value;
      const cLogo = settings.find(s => s.setting_key === 'company_logo')?.setting_value;
      if (cName) setCompanyName(cName);
      if (cLogo) setCompanyLogo(cLogo);
      
      const allProjects = await window.api.db.read('projects');
      const allGroups = await window.api.db.read('worker_groups');
      const matchedProj = allProjects.find(p => p.id == worker.project_id);
      const matchedGroup = allGroups.find(g => g.id == worker.group_id);
      setProjectName(matchedProj ? matchedProj.name : '');
      setGroupName(matchedGroup ? matchedGroup.name : '');
      
      // Perform backend statement calculation
      const stmtRes = await window.api.finance.workerStatement({
        worker_id: worker.id,
        start_date: filterStartDate,
        end_date: filterEndDate
      });

      if (stmtRes.success) {
        setTimesheets(stmtRes.timesheets);
        setTransactions(stmtRes.transactions);
        // We will store the summary for the report tab
        setReportSummary(stmtRes.summary);
      }
      
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [worker.id, filterStartDate, filterEndDate]);

  // Live calculation of wage
  useEffect(() => {
    const calculateLive = async () => {
      if (formData.work_type_id && window.api) {
        const selectedType = workTypes.find(wt => wt.id == formData.work_type_id);
        if (selectedType) {
          const res = await window.api.finance.calculateWage({
            daily_wage: worker.daily_wage,
            multiplier: selectedType.multiplier,
            overtime_hours: formData.overtime_hours
          });
          if (res.success) {
            setCalculatedWage(res.wage);
          }
        }
      }
    };
    calculateLive();
  }, [formData.work_type_id, formData.overtime_hours, workTypes]);

  const handlePuantajChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'overtime_hours' ? Number(value) : value
    }));
  };

  const handleAvansChange = (e) => {
    const { name, value } = e.target;
    setAvansData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  const handleSubmitTimesheet = async (e) => {
    e.preventDefault();
    const selectedType = workTypes.find(wt => wt.id == formData.work_type_id);
    
    if (window.api && selectedType) {
      const dataToSave = {
        worker_id: worker.id,
        work_date: formData.work_date,
        work_type_id: formData.work_type_id,
        applied_wage: worker.daily_wage,
        applied_multiplier: selectedType.multiplier,
        overtime_hours: formData.overtime_hours,
        earned_amount: calculatedWage,
        notes: formData.notes,
        tags: JSON.stringify(puantajTags),
        project_id: worker.project_id
      };

      await window.api.db.create('timesheets', dataToSave);
      setFormData(prev => ({ ...prev, overtime_hours: 0, notes: '' }));
      setPuantajTags([]);
      fetchProfileData(); 
    }
  };

  const handleSubmitAvans = async (e) => {
    e.preventDefault();
    if (window.api && avansData.amount > 0) {
      const dataToSave = {
        worker_id: worker.id,
        trans_date: avansData.trans_date,
        trans_type: 'Avans',
        amount: avansData.amount,
        notes: avansData.notes,
        tags: JSON.stringify(avansTags),
        project_id: worker.project_id
      };
      
      const res = await window.api.finance.createAdvance(dataToSave);
      if (res.success) {
        setAvansData(prev => ({ ...prev, amount: '', notes: '' }));
        setAvansTags([]);
        fetchProfileData();
      } else {
        alert('Hata: ' + res.message);
      }
    }
  };

  const handleDeleteTimesheet = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Puantajı Sil',
      message: 'Bu puantaj kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: async () => {
        await window.api.db.delete('timesheets', id);
        fetchProfileData();
      }
    });
  };

  const handleDeleteTransaction = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Avansı Sil',
      message: 'Bu avansı silmek istediğinize emin misiniz? Sistem bu tutarı Kasa\'dan da otomatik olarak iptal edecektir.',
      onConfirm: async () => {
        await window.api.finance.deleteTransaction(id);
        fetchProfileData();
      }
    });
  };

  // Dinamik Bakiye Hesaplama (Frontend Filtreleri + Backend Özeti)
  const calculateReport = () => {
    const donemIslemleri = [];

    timesheets.forEach(ts => {
      const wType = workTypes.find(wt => wt.id == ts.work_type_id)?.name || 'Puantaj';
      donemIslemleri.push({
        id: 'ts_' + ts.id,
        date: ts.work_date,
        type: 'Puantaj',
        desc: `${wType} (${ts.overtime_hours} saat mesai)`,
        amount: ts.earned_amount,
        isIncome: true
      });
    });

    transactions.forEach(tr => {
      donemIslemleri.push({
        id: 'tr_' + tr.id,
        date: tr.trans_date,
        type: 'Avans',
        desc: tr.notes || 'Avans Kesintisi',
        amount: tr.amount,
        isIncome: false
      });
    });

    const finalIslemler = donemIslemleri.filter(item => {
      let matchText = true;
      let matchType = true;
      if (filterText) matchText = item.desc.toLowerCase().includes(filterText.toLowerCase());
      if (filterType !== 'Tümü') matchType = item.type === filterType;
      return matchText && matchType;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Values from backend
    const devredenBakiye = reportSummary ? reportSummary.previous_balance : 0;
    const donemHakEdis = reportSummary ? reportSummary.periodEarned : 0;
    const donemAvans = reportSummary ? reportSummary.periodAdvance : 0;
    const yeniBakiye = reportSummary ? reportSummary.new_balance : 0;

    return { devredenBakiye, donemHakEdis, donemAvans, yeniBakiye, islemler: finalIslemler };
  };

  const cReport = calculateReport();

  const handleExport = (format) => {
    const dataToExport = [];
    dataToExport.push({
      [t('worker_profile.table.date')]: filterStartDate || '-',
      [t('worker_profile.table.type')]: t('worker_profile.summary.previous_balance'),
      [t('worker_profile.table.desc')]: 'Önceki dönemlerden aktarılan net bakiye',
      [t('worker_profile.table.amount')]: cReport.devredenBakiye
    });

    cReport.islemler.forEach(item => {
      dataToExport.push({
        'Tarih': item.date,
        'İşlem Türü': item.type,
        'Açıklama': item.desc,
        'Tutar (TL)': (item.isIncome ? '+' : '-') + item.amount
      });
    });

    const fName = `${worker.full_name}_Hesap_Ekstresi`;
    if (format === 'excel') exportToExcel(dataToExport, fName);
    if (format === 'csv') exportToCSV(dataToExport, fName);
    if (format === 'json') exportToJSON(dataToExport, fName);
  };

  const handleWhatsAppSend = () => {
    if (!worker || !worker.phone) {
      alert(t('worker_profile.whatsapp_no_phone', 'Personelin kayıtlı telefon numarası bulunamadı.'));
      return;
    }
    
    let cleanPhone = worker.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '90' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = '90' + cleanPhone.substring(1);
    }
    
    const formattedEarned = formatCurrency(cReport.donemHakEdis, i18n.language);
    const formattedAdvance = formatCurrency(cReport.donemAvans, i18n.language);
    const formattedBalance = formatCurrency(cReport.yeniBakiye, i18n.language);
    
    const messageTemplate = t('worker_profile.whatsapp_message_template', 
      'Sayın {{name}}, {{startDate}} - {{endDate}} tarihleri arasındaki hesap ekstreniz:\n\n- Toplam Hak Ediş: {{earned}}\n- Toplam Ödenen/Avans: {{advance}}\n- Kalan Bakiye: {{balance}}\n\nBilgilerinize sunarız.'
    );
    
    const message = messageTemplate
      .replace('{{name}}', worker.full_name)
      .replace('{{startDate}}', filterStartDate || '')
      .replace('{{endDate}}', filterEndDate || '')
      .replace('{{earned}}', formattedEarned)
      .replace('{{advance}}', formattedAdvance)
      .replace('{{balance}}', formattedBalance);
      
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const getFormatFromBase64 = (base64) => {
      if (!base64) return 'PNG';
      const match = base64.match(/^data:image\/([a-zA-Z+]+);base64,/);
      if (match && match[1]) {
        const ext = match[1].toUpperCase();
        if (ext === 'JPEG' || ext === 'JPG') return 'JPEG';
        if (ext === 'PNG') return 'PNG';
        if (ext === 'WEBP') return 'WEBP';
        return ext;
      }
      return 'PNG';
    };

    const trMap = { 'ç':'c', 'ğ':'g', 'ş':'s', 'ö':'o', 'ü':'u', 'ı':'i', 'Ç':'C', 'Ğ':'G', 'Ş':'S', 'Ö':'O', 'Ü':'U', 'İ':'I' };
    const toEn = (str) => {
      if (!str) return '';
      let s = String(str);
      s = s.replace(/[çğşöüıÇĞŞÖÜİ]/g, letter => trMap[letter]);
      s = s.replace(/₺/g, 'TL');
      return s;
    };
    
    // Header
    let textStartY = 20;

    if (companyLogo) {
      try {
        // Calculate dimensions to fit max height 20 while keeping aspect ratio
        // We'll just draw it centered above the name or to the left. Let's draw it centered.
        doc.addImage(companyLogo, getFormatFromBase64(companyLogo), pageWidth / 2 - 15, 10, 30, 15);
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
    doc.text('CARI HESAP EKSTRESI', pageWidth / 2, textStartY + 10, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Personel: ${toEn(worker.full_name)}`, 14, textStartY + 25);
    doc.text(`Tarih Araligi: ${filterStartDate || 'Tumu'} / ${filterEndDate || 'Tumu'}`, 14, textStartY + 30);
    
    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(249, 250, 251);
    doc.rect(14, textStartY + 35, pageWidth - 28, 20, 'FD');
    doc.setFontSize(10);
    doc.text(`Devreden Bakiye: ${cReport.devredenBakiye} TL`, 18, textStartY + 42);
    doc.text(`Donem Hak Edis: +${cReport.donemHakEdis} TL`, 18, textStartY + 49);
    doc.text(`Donem Avans: -${cReport.donemAvans} TL`, pageWidth / 2, textStartY + 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`DONEM SONU NET BAKIYE: ${cReport.yeniBakiye} TL`, pageWidth / 2, textStartY + 49);
    doc.setFont('helvetica', 'normal');
    
    let currentY = textStartY + 65;
    
    if (cReport.islemler.length > 0) {
      const tBody = cReport.islemler.map(item => [
        item.date, 
        toEn(item.type), 
        toEn(item.desc), 
        (item.isIncome ? '+' : '-') + `${item.amount} TL`
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Tarih', 'Islem Turu', 'Aciklama', 'Tutar']],
        body: tBody,
        theme: 'striped',
        headStyles: { fillColor: [56, 189, 248] },
        margin: { left: 14, right: 14 }
      });
    } else {
      doc.text('Bu donemde herhangi bir islem bulunamadi.', 14, currentY);
    }
    
    doc.save(`${toEn(worker.full_name)}_Hesap_Ekstresi.pdf`);
  };

  const isPositive = balance >= 0;

  return (
    <div className="worker-profile">
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="btn" style={{ marginBottom: 0 }} onClick={onBack}>← {t('worker_profile.back')}</button>
          <span 
            onClick={() => setHelpOpen(true)}
            style={{ 
              cursor: 'pointer', 
              opacity: 0.4, 
              transition: 'opacity 0.25s ease-in-out', 
              fontSize: '1.6rem',
              userSelect: 'none',
              padding: '0.25rem'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
            title={t('common.page_guide', 'Sayfa Kılavuzu')}
          >
            💡
          </span>
        </div>
        
        <div className="profile-grid">
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' }}>
              {worker.full_name.charAt(0)}
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{worker.full_name}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', margin: '0.5rem 0 1rem 0' }}>
              {projectName && (
                <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: '500' }}>
                  🏗️ {projectName}
                </span>
              )}
              {groupName && (
                <span style={{ fontSize: '0.8rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: '500' }}>
                  👥 {groupName}
                </span>
              )}
            </div>
            <p className="card-subtitle mb-4">{worker.tc_no ? `${t('worker.idLabel', 'ID')}: ${worker.tc_no}` : ''} | {worker.phone}</p>
            
            <h3 className="card-subtitle">{t('worker_profile.current_balance')}</h3>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              marginTop: '0.5rem',
              color: isPositive ? 'var(--success-text)' : 'var(--danger-text)',
              textShadow: isPositive ? 'var(--success-shadow)' : 'var(--danger-shadow)'
            }}>
              {formatCurrency(balance, i18n.language)}
            </div>
            <p className="card-subtitle mt-4">{t('worker_profile.daily_wage')}: {formatCurrency(worker.daily_wage, i18n.language)}</p>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
              <div 
                style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', fontWeight: '500', background: activeTab === 'puantaj' ? 'rgba(139, 92, 246, 0.2)' : 'transparent' }}
                onClick={() => setActiveTab('puantaj')}
              >
                {t('worker_profile.timesheet')}
              </div>
              <div 
                style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', fontWeight: '500', background: activeTab === 'avans' ? 'rgba(239, 68, 68, 0.2)' : 'transparent' }}
                onClick={() => setActiveTab('avans')}
              >
                {t('worker_profile.advance')}
              </div>
              <div 
                style={{ flex: 1, padding: '1rem', textAlign: 'center', cursor: 'pointer', fontWeight: '500', background: activeTab === 'rapor' ? 'rgba(56, 189, 248, 0.2)' : 'transparent' }}
                onClick={() => setActiveTab('rapor')}
              >
                {t('worker_profile.report')}
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {activeTab === 'puantaj' ? (
                <form onSubmit={handleSubmitTimesheet}>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.timesheet_form.date')}</label>
                    <CustomDatePicker name="work_date" className="form-input" value={formData.work_date} onChange={handlePuantajChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.timesheet_form.type')}</label>
                    <select name="work_type_id" className="form-input" value={formData.work_type_id} onChange={handlePuantajChange} required>
                      {workTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name} (x{wt.multiplier})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.timesheet_form.overtime')}</label>
                    <input type="number" name="overtime_hours" className="form-input" min="0" step="0.5" value={formData.overtime_hours} onChange={handlePuantajChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.timesheet_form.notes')}</label>
                    <input type="text" name="notes" className="form-input" value={formData.notes} onChange={handlePuantajChange} placeholder={t('worker_profile.timesheet_form.notes_ph')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.timesheet_form.tags_label')}</label>
                    <TagInput tags={puantajTags} setTags={setPuantajTags} placeholder={t('worker_profile.timesheet_form.tags_ph')} />
                  </div>
                  <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <span className="form-label" style={{ marginBottom: 0 }}>{t('worker_profile.calculated_earned')}</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{formatCurrency(calculatedWage, i18n.language)}</div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t('worker_profile.timesheet_form.add_btn')}</button>
                </form>
              ) : activeTab === 'avans' ? (
                <form onSubmit={handleSubmitAvans}>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.advance_form.date')}</label>
                    <CustomDatePicker name="trans_date" className="form-input" value={avansData.trans_date} onChange={handleAvansChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.advance_form.amount')} ({getCurrencySymbol(i18n.language)})</label>
                    <input type="number" name="amount" className="form-input" min="1" step="0.01" value={avansData.amount} onChange={handleAvansChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.advance_form.notes')}</label>
                    <input type="text" name="notes" className="form-input" value={avansData.notes} onChange={handleAvansChange} placeholder={t('worker_profile.advance_form.notes_ph', 'Örn: Haftalık avans')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('worker_profile.advance_form.tags_label')}</label>
                    <TagInput tags={avansTags} setTags={setAvansTags} placeholder={t('worker_profile.advance_form.tags_ph')} />
                  </div>
                  <div style={{ color: 'var(--danger-text)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                    {t('worker_profile.auto_deduct_notice')}
                  </div>
                  <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>{t('worker_profile.advance_form.add_btn')}</button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 className="card-title mb-4">{t('worker_profile.account_statement')}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.start_date')}</label>
                      <CustomDatePicker className="form-input" value={filterStartDate} onChange={e => handleStartDateChange(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.end_date')}</label>
                      <CustomDatePicker className="form-input" value={filterEndDate} onChange={e => handleEndDateChange(e.target.value)} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.search')}</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={t('worker_profile.filter.search')} 
                          value={filterText} 
                          onChange={e => setFilterText(e.target.value)} 
                          style={{ width: '100%', paddingRight: '2.5rem' }}
                        />
                        {filterText && (
                          <button
                            type="button"
                            onClick={() => setFilterText('')}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10
                            }}
                            title={t('common.clear', 'Temizle')}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.table.type', 'İşlem Türü')}</label>
                      <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="Tümü">{t('worker_profile.filter.type_all')}</option>
                        <option value="Puantaj">{t('worker_profile.filter.type_timesheet')}</option>
                        <option value="Avans">{t('worker_profile.filter.type_advance')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="text-muted">{t('worker_profile.summary.previous_balance')}:</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCurrency(cReport.devredenBakiye, i18n.language)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="text-muted">{t('worker_profile.summary.period_earned')}:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--success-text)' }}>+{formatCurrency(cReport.donemHakEdis, i18n.language)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                      <span className="text-muted">{t('worker_profile.summary.period_advance')}:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--danger-text)' }}>-{formatCurrency(cReport.donemAvans, i18n.language)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">{t('worker_profile.summary.new_balance')}:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: cReport.yeniBakiye >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                        {formatCurrency(cReport.yeniBakiye, i18n.language)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <select className="btn" style={{ padding: '0.5rem', flex: 1, background: 'var(--accent)', color: 'var(--accent-text)', fontWeight: 'bold' }} onChange={e => {
                        const val = e.target.value;
                        if (val === 'pdf') generatePDF();
                        else if (val) handleExport(val);
                        e.target.value = "";
                      }} value="">
                      <option value="" disabled>{t('worker_profile.filter.export')}...</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel (.xlsx)</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ padding: '0.5rem', flex: 1, background: '#25D366', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', border: 'none' }}
                      onClick={handleWhatsAppSend}
                    >
                      🟢 WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-panel glass-card">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', gap: '1rem', paddingBottom: '0.5rem' }}>
            <h3 
              className="card-title" 
              style={{ cursor: 'pointer', color: activeTab === 'puantaj' ? 'var(--text-main)' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('puantaj')}
            >
              {t('worker_profile.timesheet_history')}
            </h3>
            <h3 
              className="card-title" 
              style={{ cursor: 'pointer', color: activeTab === 'avans' ? 'var(--text-main)' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('avans')}
            >
              {t('worker_profile.advance_history')}
            </h3>
            <h3 
              className="card-title" 
              style={{ cursor: 'pointer', color: activeTab === 'rapor' ? 'var(--text-main)' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('rapor')}
            >
              {t('worker_profile.monthly_report_view')}
            </h3>
          </div>
          
          {activeTab === 'puantaj' ? (
            timesheets.length === 0 ? (
              <p className="text-muted text-center" style={{ marginTop: '2rem' }}>{t('worker_profile.no_timesheet')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                {timesheets.map(ts => {
                  const typeName = workTypes.find(wt => wt.id == ts.work_type_id)?.name || t('worker_profile.unknown');
                  return (
                    <div key={ts.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{formatDate(ts.work_date, i18n.language)} <span className="wage-badge" style={{ marginLeft: '10px' }}>{typeName}</span></div>
                        <div className="card-subtitle mt-4" style={{ marginTop: '0.5rem' }}>
                          {t('worker_profile.wage_history_label')}: {formatCurrency(ts.applied_wage, i18n.language)} (x{ts.applied_multiplier})
                          {ts.overtime_hours > 0 && ` | +${ts.overtime_hours} ${t('worker_profile.overtime_hours_suffix')}`}
                        </div>
                        {ts.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{t('worker_profile.note_label')}: {ts.notes}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--success-text)', fontSize: '1.1rem' }}>+{formatCurrency(ts.earned_amount, i18n.language)}</div>
                        <button onClick={() => handleDeleteTimesheet(ts.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem' }}>{t('common.delete')}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : activeTab === 'avans' ? (
            transactions.length === 0 ? (
              <p className="text-muted text-center" style={{ marginTop: '2rem' }}>{t('worker_profile.no_advance')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                {transactions.map(tr => (
                  <div key={tr.id} style={{ background: 'var(--danger-bg-light)', border: '1px solid var(--danger-border)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{formatDate(tr.trans_date, i18n.language)} <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'var(--danger-text)', border: '1px solid var(--danger-text)', padding: '2px 6px', borderRadius: '4px' }}>{t('worker_profile.advance_out')}</span></div>
                      <div className="card-subtitle" style={{ marginTop: '0.5rem' }}>{tr.notes || '-'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--danger-text)', fontSize: '1.1rem' }}>-{formatCurrency(tr.amount, i18n.language)}</div>
                      <button onClick={() => handleDeleteTransaction(tr.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', textDecoration: 'underline' }}>{t('worker_profile.delete_cancel')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
          {activeTab === 'rapor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
                <span style={{ fontWeight: '600' }}>{t('worker_profile.summary.carried_balance_report', 'Devreden Bakiye Raporu')}</span>
                <div style={{ fontWeight: 'bold', color: cReport.devredenBakiye >= 0 ? 'var(--success-text)' : 'var(--danger-text)', fontSize: '1.1rem' }}>
                  {formatCurrency(cReport.devredenBakiye, i18n.language)}
                </div>
              </div>
              
              {cReport.islemler.length === 0 ? (
                <p className="text-muted text-center" style={{ marginTop: '2rem' }}>{t('worker_profile.no_period_data')}</p>
              ) : (
                cReport.islemler.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: item.isIncome ? 'var(--success-bg-light)' : 'var(--danger-bg-light)' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{formatDate(item.date, i18n.language)} <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: item.isIncome ? 'var(--success-text)' : 'var(--danger-text)', border: `1px solid var(${item.isIncome ? '--success-text' : '--danger-text'})`, padding: '2px 6px', borderRadius: '4px' }}>{item.isIncome ? t('worker_profile.filter.type_timesheet', 'Puantaj') : t('worker.advanceBadge', 'AVANS')}</span></div>
                      <div className="card-subtitle" style={{ marginTop: '0.25rem' }}>{item.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: item.isIncome ? 'var(--success-text)' : 'var(--danger-text)', fontSize: '1.1rem' }}>{item.isIncome ? '+' : '-'}{formatCurrency(item.amount, i18n.language)}</div>
                    </div>
                  </div>
                ))
              )}
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

      <GuideDrawer 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        title={t('guides.personnel.title')} 
        desc="" 
        h1={t('guides.personnel.step1.title')} 
        p1={t('guides.personnel.step1.desc')} 
        h2={t('guides.personnel.step2.title')} 
        p2={t('guides.personnel.step2.desc')} 
        h3={t('guides.personnel.step3.title')} 
        p3={t('guides.personnel.step3.desc')} 
      />
    </div>
  );
};

export default WorkerProfile;
