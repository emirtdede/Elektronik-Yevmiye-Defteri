import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';

const ProjectManagement = ({ onSelectProject, activeProjectId }) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const fetchProjects = async () => {
    if (window.api && window.api.db) {
      setLoading(true);
      const data = await window.api.db.read('projects');
      setProjects(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    if (window.api && window.api.db) {
      await window.api.db.create('projects', {
        name: formData.name,
        location: formData.location,
        status: 'active'
      });
      setFormData({ name: '', location: '' });
      fetchProjects();
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      id
    });
  };

  const confirmDelete = async () => {
    if (window.api && window.api.db && confirmModal.id) {
      await window.api.db.delete('projects', confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      fetchProjects();
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title" style={{ fontSize: '1.5rem' }}>🏗️ {t('projects.title', 'Şantiye (Lokasyon) Yönetimi')}</h2>
      </header>

      {/* Add Project Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 2, marginBottom: 0, minWidth: '200px' }}>
          <label className="form-label">{t('projects.name_label', 'Şantiye / Proje Adı')}</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('projects.name_ph', 'Örn: Kuzey Otoyolu Viyadük İnşaatı')} 
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="form-group" style={{ flex: 1.5, marginBottom: 0, minWidth: '150px' }}>
          <label className="form-label">{t('projects.location_label', 'Lokasyon / Adres')}</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('projects.location_ph', 'Örn: İstanbul / Çatalca')} 
            value={formData.location}
            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>{t('projects.add_btn', 'Proje Ekle')}</button>
      </form>

      {/* Projects List */}
      {loading ? (
        <div className="skeleton" style={{ height: '150px', width: '100%' }}></div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          {t('projects.empty_state', 'Kayıtlı şantiye bulunamadı. Yukarıdaki formdan ilk şantiyenizi ekleyebilirsiniz.')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {projects.map(proj => {
            const isActive = proj.id === activeProjectId;
            return (
              <div 
                key={proj.id} 
                className="glass-card" 
                style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: isActive ? 'rgba(139, 92, 246, 0.05)' : 'var(--glass-bg)',
                  padding: '1.25rem'
                }}
              >
                <div>
                  <h3 className="card-title" style={{ color: isActive ? '#c4b5fd' : '#fff' }}>
                    {proj.name} {isActive && <span style={{ fontSize: '0.75rem', background: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', marginLeft: '0.5rem', color: '#fff' }}>AKTİF ÇALIŞMA ALANI</span>}
                  </h3>
                  <p className="card-subtitle">📍 {proj.location || 'Lokasyon belirtilmemiş'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!isActive && (
                    <button 
                      className="btn" 
                      onClick={() => onSelectProject(proj.id)}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      Çalışma Alanı Seç
                    </button>
                  )}
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(proj.id)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Şantiyeyi Sil"
        message="Bu şantiyeyi silmek istediğinize emin misiniz? Şantiyeye bağlı veriler doğrudan silinmez ancak listelerden gizlenir."
      />
    </div>
  );
};

export default ProjectManagement;
