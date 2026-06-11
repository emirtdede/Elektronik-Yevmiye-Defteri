import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { exportToExcel, exportToCSV, exportToJSON, exportToText, exportToMarkdown } from '../utils/exportUtils';

const SystemLogs = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [filterText, setFilterText] = useState('');

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
    if (filterText) {
      return log.toLowerCase().includes(filterText.toLowerCase());
    }
    return true;
  }).reverse(); // Show latest first

  const handleExport = (format) => {
    const filename = `Sistem_Loglari_${startDate}_${endDate}`;
    
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

  return (
    <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: 0 }}>{t('logs.title')}</h3>
        
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
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.start_date')}</label>
          <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.end_date')}</label>
          <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('worker_profile.filter.search')}</label>
          <input type="text" className="form-input" placeholder={t('worker_profile.filter.search')} value={filterText} onChange={e => setFilterText(e.target.value)} />
        </div>
      </div>

      <div style={{ flex: 1, background: 'var(--log-bg)', borderRadius: '8px', padding: '1rem', overflowY: 'auto', border: '1px solid var(--log-border)', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--log-text)', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Seçili aralıkta log bulunamadı.</div>
        ) : (
          filteredLogs.map((logLine, idx) => {
            // Simple syntax highlighting based on log level or keywords
            let color = 'var(--log-text)';
            if (logLine.includes('[error]')) color = 'var(--danger-text)';
            else if (logLine.includes('[DB CREATE]')) color = 'var(--success-text)';
            else if (logLine.includes('[DB DELETE]')) color = 'var(--danger-text)';
            else if (logLine.includes('[DB UPDATE]')) color = 'var(--accent)';

            return (
              <div key={idx} style={{ marginBottom: '4px', color, borderBottom: '1px solid var(--log-border)', paddingBottom: '4px' }}>
                {logLine}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
