import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';
import CustomDatePicker from './ui/CustomDatePicker';
import GuideDrawer from './ui/GuideDrawer';

const DailyJournal = ({ activeProjectId, projects = [] }) => {
  const { t, i18n } = useTranslation();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const containerRef = useRef(null);
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString();

  const [formData, setFormData] = useState({
    journal_date: todayStr,
    weather_temp: '',
    weather_desc: '',
    weather_icon: '',
    worker_count: '0',
    notes: ''
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleStartEdit = (j) => {
    setEditingId(j.id);
    setFormData({
      journal_date: j.journal_date,
      weather_temp: j.weather_temp !== null && j.weather_temp !== undefined ? j.weather_temp.toString() : '',
      weather_desc: j.weather_desc || '',
      weather_icon: j.weather_icon || '',
      worker_count: j.worker_count !== null && j.worker_count !== undefined ? j.worker_count.toString() : '0',
      notes: j.notes || ''
    });
  };

  const fetchJournals = async () => {
    if (!activeProjectId) return;
    if (window.api && window.api.db) {
      setLoading(true);
      const data = await window.api.db.read('daily_journals', { project_id: activeProjectId });
      setJournals(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [activeProjectId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch weather automatically when location or date changes
  useEffect(() => {
    const fetchWeather = async () => {
      if (!activeProject || !activeProject.location) return;
      setWeatherLoading(true);
      if (window.api && window.api.system.getWeather) {
        const res = await window.api.system.getWeather({ location: activeProject.location, lang: i18n.language });
        if (res.success) {
          setFormData(prev => ({
            ...prev,
            weather_temp: res.temp.toString(),
            weather_desc: res.desc,
            weather_icon: res.icon
          }));
        }
      }
      
      // Calculate worker count automatically from timesheets for this date
      if (window.api && window.api.db) {
        const tsData = await window.api.db.read('timesheets', { work_date: formData.journal_date });
        // Filter by workers on active project
        const workers = await window.api.db.read('workers', { project_id: activeProjectId });
        const workerIds = workers.map(w => w.id);
        const count = tsData.filter(ts => workerIds.includes(ts.worker_id)).length;
        setFormData(prev => ({ ...prev, worker_count: count.toString() }));
      }
      
      setWeatherLoading(false);
    };

    fetchWeather();
  }, [activeProjectId, formData.journal_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !formData.journal_date) return;

    if (window.api && window.api.db) {
      const payload = {
        weather_temp: formData.weather_temp ? Number(formData.weather_temp) : null,
        weather_desc: formData.weather_desc,
        weather_icon: formData.weather_icon,
        worker_count: formData.worker_count ? Number(formData.worker_count) : 0,
        notes: formData.notes
      };

      if (editingId) {
        await window.api.db.update('daily_journals', editingId, payload);
        setEditingId(null);
      } else {
        // Check if journal already exists for this date on this project
        const existing = journals.find(j => j.journal_date === formData.journal_date);
        if (existing) {
          // Update it
          await window.api.db.update('daily_journals', existing.id, payload);
        } else {
          // Create new
          await window.api.db.create('daily_journals', {
            project_id: activeProjectId,
            journal_date: formData.journal_date,
            ...payload
          });
        }
      }
      setFormData(prev => ({
        ...prev,
        notes: ''
      }));
      fetchJournals();
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (window.api && window.api.db && confirmModal.id) {
      await window.api.db.delete('daily_journals', confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      fetchJournals();
    }
  };

  // Filter and paginated journals
  const filteredJournals = journals.filter(j => 
    j.notes.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (j.weather_desc && j.weather_desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
    j.journal_date.includes(searchQuery)
  );

  // Apply sorting
  filteredJournals.sort((a, b) => {
    if (sortBy === 'date_desc') {
      return b.journal_date.localeCompare(a.journal_date);
    } else if (sortBy === 'date_asc') {
      return a.journal_date.localeCompare(b.journal_date);
    } else if (sortBy === 'workers_desc') {
      const wa = a.worker_count ? parseInt(a.worker_count, 10) : 0;
      const wb = b.worker_count ? parseInt(b.worker_count, 10) : 0;
      return wb - wa;
    } else if (sortBy === 'workers_asc') {
      const wa = a.worker_count ? parseInt(a.worker_count, 10) : 0;
      const wb = b.worker_count ? parseInt(b.worker_count, 10) : 0;
      return wa - wb;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredJournals.length / itemsPerPage);
  const paginatedJournals = filteredJournals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>{t('nav.journal', 'Günlük Jurnal Takibi')}</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>{t('common.select_project_msg', 'Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.')}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'start', position: 'relative' }}>
      {/* Main List and Form */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('journal.title', '📓 Şantiye Günlük Jurnali')}</h2>
            <p className="card-subtitle" style={{ marginBottom: 0 }}>{t('common.active_project', 'Aktif Şantiye:')} <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>
          </div>
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

        {/* Add/Edit Journal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">{t('common.date', 'Tarih')}</label>
              <CustomDatePicker 
                className="form-input" 
                value={formData.journal_date}
                onChange={e => setFormData(prev => ({ ...prev, journal_date: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">{t('journal.worker_count', 'Çalışan Personel Sayısı')}</label>
              <input 
                type="number" 
                className="form-input" 
                min="0"
                value={formData.worker_count}
                onChange={e => setFormData(prev => ({ ...prev, worker_count: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div style={{ flex: 1 }}>
              <span className="form-label" style={{ marginBottom: '0.25rem' }}>{t('journal.weather', 'Hava Durumu')}</span>
              {weatherLoading ? (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('journal.weather_loading', 'Bulutlardan okunuyor...')}</span>
              ) : formData.weather_desc ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={`http://openweathermap.org/img/wn/${formData.weather_icon}.png`} alt="Weather Icon" style={{ width: '30px', height: '30px' }} />
                  <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{formData.weather_temp} °C, {formData.weather_desc.toUpperCase()}</strong>
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('journal.weather_no_location', 'Şantiye konumu girilmediği için çekilemedi.')}</span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                <label className="form-label">{t('journal.temperature', 'Sıcaklık (°C)')}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.weather_temp}
                  onChange={e => setFormData(prev => ({ ...prev, weather_temp: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                <label className="form-label">{t('common.description', 'Açıklama')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.weather_desc}
                  onChange={e => setFormData(prev => ({ ...prev, weather_desc: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('journal.notes', 'Günlük Jurnal Notları / Yapılan İşler')}</label>
            <textarea 
              className="form-input" 
              placeholder={t('journal.notes_ph', 'Örn: 2. kat kolon demirleri bağlandı, C30 beton dökümü gerçekleştirildi...')} 
              rows="4"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              required
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? t('common.save', 'Güncelle') : t('journal.save_btn', 'Jurnali Kaydet / Güncelle')}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn" 
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    journal_date: todayStr,
                    weather_temp: '',
                    weather_desc: '',
                    weather_icon: '',
                    worker_count: '0',
                    notes: ''
                  });
                }}
              >
                {t('common.cancel', 'Vazgeç')}
              </button>
            )}
          </div>
        </form>

        {/* Filters & Search Bar */}
        {journals.length > 0 && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            flexWrap: 'wrap' 
          }}>
            <div style={{ position: 'relative', flex: 2, minWidth: '200px', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text"
                className="form-input"
                placeholder={t('filters.search_journal', 'Jurnal notlarında, hava durumunda veya tarihte ara...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingRight: '2.5rem', width: '100%', marginBottom: 0 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
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

            <select 
              className="form-input" 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}
            >
              <option value="date_desc">{t('filters.newest', 'Tarih: Yeniden Eskiye')}</option>
              <option value="date_asc">{t('filters.oldest', 'Tarih: Eskiden Yeniye')}</option>
              <option value="workers_desc">{t('filters.workers_desc', 'İşçi Sayısı: En Çoktan En Aza')}</option>
              <option value="workers_asc">{t('filters.workers_asc', 'İşçi Sayısı: En Azdan En Çoğa')}</option>
            </select>
          </div>
        )}

        {/* Journals List */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : filteredJournals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {searchQuery ? t('journal.no_results', 'Arama kriterlerine uygun jurnal kaydı bulunamadı.') : t('journal.empty_state', 'Henüz günlük jurnal kaydı bulunmuyor.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paginatedJournals.map(j => (
              <div key={j.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{j.journal_date}</strong>
                    {j.weather_desc && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {j.weather_icon && <img src={`http://openweathermap.org/img/wn/${j.weather_icon}.png`} alt="Icon" style={{ width: '20px', height: '20px' }} />}
                        {j.weather_temp} °C, {j.weather_desc}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '10px', marginRight: '0.5rem' }}>
                      👷 {j.worker_count} {t('journal.worker_count_badge', 'Çalışan')}
                    </span>
                    {j.journal_date === todayStr && (
                      <button 
                        className="btn" 
                        onClick={() => handleStartEdit(j)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        {t('dashboard.edit', 'Düzenle')}
                      </button>
                    )}
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete(j.id)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      {t('common.delete', 'Sil')}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{j.notes}</p>
              </div>
            ))}

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
                borderRadius: '0 0 12px 12px'
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
        )}
      </div>

      <GuideDrawer 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        title={t('journal.help_title')} 
        desc={t('journal.help_desc')} 
        h1={t('journal.help_h1')} 
        p1={t('journal.help_p1')} 
        h2={t('journal.help_h2')} 
        p2={t('journal.help_p2')} 
        h3={t('journal.help_h3')} 
        p3={t('journal.help_p3')} 
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title={t('journal.delete_title', 'Jurnali Sil')}
        message={t('journal.delete_confirm', 'Bu günlük jurnal kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')}
      />
    </div>
  );
};

export default DailyJournal;
