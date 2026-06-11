import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';

const DailyJournal = ({ activeProjectId, projects = [] }) => {
  const { t } = useTranslation();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [formData, setFormData] = useState({
    journal_date: new Date().toISOString().split('T')[0],
    weather_temp: '',
    weather_desc: '',
    weather_icon: '',
    worker_count: '0',
    notes: ''
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const activeProject = projects.find(p => p.id === activeProjectId);

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

  // Fetch weather automatically when location or date changes
  useEffect(() => {
    const fetchWeather = async () => {
      if (!activeProject || !activeProject.location) return;
      setWeatherLoading(true);
      if (window.api && window.api.system.getWeather) {
        const res = await window.api.system.getWeather({ location: activeProject.location });
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
      // Check if journal already exists for this date on this project
      const existing = journals.find(j => j.journal_date === formData.journal_date);
      if (existing) {
        // Update it
        await window.api.db.update('daily_journals', existing.id, {
          weather_temp: Number(formData.weather_temp),
          weather_desc: formData.weather_desc,
          weather_icon: formData.weather_icon,
          worker_count: Number(formData.worker_count),
          notes: formData.notes
        });
      } else {
        // Create new
        await window.api.db.create('daily_journals', {
          project_id: activeProjectId,
          journal_date: formData.journal_date,
          weather_temp: Number(formData.weather_temp),
          weather_desc: formData.weather_desc,
          weather_icon: formData.weather_icon,
          worker_count: Number(formData.worker_count),
          notes: formData.notes
        });
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

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>Günlük Jurnal Takibi</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
      {/* Main List and Form */}
      <div className="glass-card">
        <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📓 Şantiye Günlük Jurnali</h2>
        <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Aktif Şantiye: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>

        {/* Add/Edit Journal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Tarih</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.journal_date}
                onChange={e => setFormData(prev => ({ ...prev, journal_date: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Çalışan Personel Sayısı</label>
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
              <span className="form-label" style={{ marginBottom: '0.25rem' }}>Hava Durumu</span>
              {weatherLoading ? (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Bulutlardan okunuyor...</span>
              ) : formData.weather_desc ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={`http://openweathermap.org/img/wn/${formData.weather_icon}.png`} alt="Weather Icon" style={{ width: '30px', height: '30px' }} />
                  <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{formData.weather_temp} °C, {formData.weather_desc.toUpperCase()}</strong>
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Şantiye konumu girilmediği için çekilemedi.</span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                <label className="form-label">Sıcaklık (°C)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.weather_temp}
                  onChange={e => setFormData(prev => ({ ...prev, weather_temp: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                <label className="form-label">Açıklama</label>
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
            <label className="form-label">Günlük Jurnal Notları / Yapılan İşler</label>
            <textarea 
              className="form-input" 
              placeholder="Örn: 2. kat kolon demirleri bağlandı, C30 beton dökümü gerçekleştirildi..." 
              rows="4"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Jurnali Kaydet / Güncelle</button>
        </form>

        {/* Journals List */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : journals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Henüz günlük jurnal kaydı bulunmuyor.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {journals.map(j => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '10px' }}>
                      👷 {j.worker_count} Çalışan
                    </span>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete(j.id)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{j.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Widget Panel */}
      <div className="glass-card">
        <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>💡 Şantiye Günlüğü Hakkında</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Günlük Jurnal modülü, o gün sahada yapılan işleri, çalışan kişi sayılarını ve hava koşullarını otonom arşivler.
          <br /><br />
          Şantiyenin **lokasyon** bilgisi girildiğinde, sistem OpenWeather API üzerinden sıcaklık ve durum bilgisini o gün için otomatik olarak çeker.
        </p>
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Jurnali Sil"
        message="Bu günlük jurnal kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
};

export default DailyJournal;
