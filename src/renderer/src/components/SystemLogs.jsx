import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { exportToExcel, exportToCSV, exportToJSON, exportToText, exportToMarkdown } from '../utils/exportUtils';
import CustomDatePicker from './ui/CustomDatePicker';
import { formatDate, formatTime } from '../utils/formatUtils';
import GuideDrawer from './ui/GuideDrawer';

const SystemLogs = () => {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterText, setFilterText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const containerRef = useRef(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleStartDateChange = (val) => {
    if (val && endDate && new Date(val) > new Date(endDate)) {
      setStartDate(endDate);
      setEndDate(val);
    } else {
      setStartDate(val);
    }
  };

  const handleEndDateChange = (val) => {
    if (val && startDate && new Date(startDate) > new Date(val)) {
      setEndDate(startDate);
      setStartDate(val);
    } else {
      setEndDate(val);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, startDate, endDate, selectedType]);

  const fetchLogs = async () => {
    if (window.api) {
      setLoading(true);
      const res = await window.api.system.readLogs(startDate, endDate);
      if (res.success) {
        setLogs(res.logs);
      } else {
        alert('Loglar okunamadı: ' + res.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate]);

  const filteredLogs = logs.filter(log => {
    if (filterText && !log.toLowerCase().includes(filterText.toLowerCase())) {
      return false;
    }
    if (selectedType) {
      if (selectedType === 'error' && !log.includes('[error]')) return false;
      if (selectedType === 'info' && !log.includes('[info]')) return false;
      if (selectedType === 'db_create' && !log.includes('[DB CREATE]')) return false;
      if (selectedType === 'db_update' && !log.includes('[DB UPDATE]')) return false;
      if (selectedType === 'db_delete' && !log.includes('[DB DELETE]')) return false;
    }
    return true;
  }).reverse(); // Show latest first

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = (format) => {
    const filename = `Sistem_Loglari_${startDate || 'Tumu'}_${endDate || 'Tumu'}`;
    
    if (format === 'txt') {
      exportToText(filteredLogs, filename);
    } else if (format === 'md') {
      exportToMarkdown(filteredLogs, filename);
    } else {
      // For JSON, Excel, CSV we need array of objects
      const objects = filteredLogs.map(l => {
        // Try to parse "[2026-06-11 15:30:00.000] [info] [DB CREATE] ..."
        const match = l.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
        if (match) {
          return { Tarih: match[1], Seviye: match[2], Mesaj: match[3] };
        }
        return { Log: l };
      });

      if (format === 'excel') exportToExcel(objects, filename);
      if (format === 'csv') exportToCSV(objects, filename);
      if (format === 'json') exportToJSON(objects, filename);
    }
  };

  const formatLogLine = (line) => {
    const match = line.match(/^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.\d+)?\] (.*)$/);
    if (match) {
      const datePart = match[1];
      const timePart = match[2];
      const rest = match[3];
      
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      const d = new Date(year, month - 1, day, hours, minutes, seconds);
      
      if (!isNaN(d.getTime())) {
        const formattedDate = formatDate(d, i18n.language);
        const formattedTime = formatTime(d, i18n.language);
        return `[${formattedDate} ${formattedTime}] ${rest}`;
      }
    }
    return line;
  };

  return (
    <>
      <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{t('logs.title')}</span>
          <span 
            onClick={() => setIsGuideOpen(true)}
            style={{ 
              cursor: 'pointer', 
              opacity: 0.4, 
              transition: 'opacity 0.25s ease-in-out', 
              fontSize: '1.4rem',
              userSelect: 'none',
              padding: '0.25rem',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
            title={t('common.page_guide', 'Sayfa Kılavuzu')}
          >
            💡
          </span>
        </h3>
        
        <select className="btn btn-primary" style={{ padding: '0.5rem', background: 'var(--accent)', color: 'var(--accent-text)', fontWeight: 'bold' }} onChange={e => {
            const val = e.target.value;
            if (val) handleExport(val);
            e.target.value = "";
          }} value="">
          <option value="" disabled>{t('logs.export')}...</option>
          <option value="txt">Metin (.txt)</option>
          <option value="md">Markdown (.md)</option>
          <option value="excel">Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
          <option value="json">JSON (.json)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('logs.filter_type', 'Log Türü')}</label>
          <select
            className="form-input"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">{t('logs.type_all', 'Tüm Log Türleri')}</option>
            <option value="info">🔵 Info</option>
            <option value="error">❌ Error</option>
            <option value="db_create">➕ DB Create</option>
            <option value="db_update">🔄 DB Update</option>
            <option value="db_delete">🗑️ DB Delete</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.start_date')}</label>
          <CustomDatePicker className="form-input" value={startDate} onChange={e => handleStartDateChange(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.end_date')}</label>
          <CustomDatePicker className="form-input" value={endDate} onChange={e => handleEndDateChange(e.target.value)} />
        </div>
      </div>

      <div ref={containerRef} style={{ flex: 1, background: 'var(--log-bg)', borderRadius: '8px', padding: '1rem', overflowY: 'auto', border: '1px solid var(--log-border)', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--log-text)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('common.loading', 'Yükleniyor...')}</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('logs.no_logs', 'Seçili aralıkta log bulunamadı.')}</div>
        ) : (
          <div key={currentPage} className="recycle-animate-page" style={{ display: 'flex', flexDirection: 'column' }}>
            {paginatedLogs.map((logLine, idx) => {
              // Simple syntax highlighting based on log level or keywords
              let color = 'var(--log-text)';
              if (logLine.includes('[error]')) color = 'var(--danger-text)';
              else if (logLine.includes('[DB CREATE]')) color = 'var(--success-text)';
              else if (logLine.includes('[DB DELETE]')) color = 'var(--danger-text)';
              else if (logLine.includes('[DB UPDATE]')) color = 'var(--accent)';

              return (
                <div key={idx} style={{ marginBottom: '4px', color, borderBottom: '1px solid var(--log-border)', paddingBottom: '4px', wordBreak: 'break-all' }}>
                  {formatLogLine(logLine)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--option-bg, #0f172a)',
          borderTop: '1px solid var(--glass-border)',
          zIndex: 10,
          padding: '1rem',
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          backdropFilter: 'blur(10px)',
          borderRadius: '0 0 8px 8px'
        }}>
          <button 
            className="btn" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            {t('common.prev', 'Önceki')}
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t('common.page_info', 'Sayfa')} {currentPage} / {totalPages}
          </span>
          <button 
            className="btn" 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            {t('common.next', 'Sonraki')}
          </button>
        </div>
      )}
      </div>
      {/* Guide Drawer */}
      <GuideDrawer 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        title={t('logs.guide.title', 'Sistem Kayıtları Kılavuzu')} 
        desc={t('logs.guide.intro', 'Sistem Kayıtları sayfası, uygulamada gerçekleşen kritik veritabanı işlemlerini, sistem olaylarını ve olası hataları kronolojik olarak takip etmenizi sağlar.')} 
        h1={t('logs.guide.levels_title', '1. Log Düzeyleri ve Renkleri')} 
        p1={t('logs.guide.levels_desc', 'Aktiviteler önem derecesine göre renklendirilir: Mavi loglar (Info) normal sistem bildirimlerini, Yeşil loglar (DB Create) yeni veri eklemelerini, Sarı loglar (DB Update) veri güncellemelerini, Kırmızı loglar ise silme işlemlerini (DB Delete) ve kritik hataları (Error) temsil eder.')} 
        h2={t('logs.guide.large_data_title', '2. Uzun Log Verileri (Base64)')} 
        p2={t('logs.guide.large_data_desc', 'Şantiye logosu gibi resim dosyalarını güncellediğinizde veritabanına büyük boyutlu Base64 metin kodları kaydedilir. Bu tür durumlarda log satırlarında çok uzun metin blokları görmeniz normaldir; bu veriler sisteme görsel yüklemelerin başarıyla kaydedildiğini doğrular.')} 
        h3={t('logs.guide.filter_export_title', '3. Arama, Filtreleme ve Dışa Aktarım')} 
        p3={t('logs.guide.filter_export_desc', 'Belirli bir tarih aralığı, kelime veya log türüne (Info, Error, vb.) göre anında filtreleme yapabilirsiniz. Ayrıca tüm kayıtları Excel, CSV, JSON, Markdown veya Düz Metin (.txt) olarak bilgisayarınıza indirebilirsiniz.')} 
      />
    </>
  );
};

export default SystemLogs;
