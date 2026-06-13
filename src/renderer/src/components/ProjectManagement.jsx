import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';
import GuideDrawer from './ui/GuideDrawer';

const ProjectManagement = ({ onSelectProject, activeProjectId }) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const containerRef = useRef(null);

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  // Filter and paginated projects
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
    <div ref={containerRef} className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏗️ {t('projects.title', 'Şantiye (Lokasyon) Yönetimi')}
        </h2>
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

      {/* Search Bar */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '1.5rem', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder={t('projects.search_placeholder', 'Şantiyelerde ara...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingRight: '2.5rem', width: '100%' }}
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
      )}

      {/* Projects List */}
      {loading ? (
        <div className="skeleton" style={{ height: '150px', width: '100%' }}></div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          {searchQuery ? t('common.no_results', 'Sonuç bulunamadı.') : t('projects.empty_state', 'Kayıtlı şantiye bulunamadı. Yukarıdaki formdan ilk şantiyenizi ekleyebilirsiniz.')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {paginatedProjects.map(proj => {
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
                    {proj.name} {isActive && <span style={{ fontSize: '0.75rem', background: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', marginLeft: '0.5rem', color: '#fff' }}>{t('projects.active_workspace', 'AKTİF ÇALIŞMA ALANI')}</span>}
                  </h3>
                  <p className="card-subtitle">📍 {proj.location || t('projects.location_unspecified', 'Lokasyon belirtilmemiş')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!isActive && (
                    <button 
                      className="btn" 
                      onClick={() => onSelectProject(proj.id)}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      {t('projects.select_workspace', 'Çalışma Alanı Seç')}
                    </button>
                  )}
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(proj.id)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    {t('common.delete', 'Sil')}
                  </button>
                </div>
              </div>
            );
          })}

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

    <ConfirmationModal 
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal({ isOpen: false, id: null })}
      onConfirm={confirmDelete}
      title="Şantiyeyi Sil"
      message="Bu şantiyeyi silmek istediğinize emin misiniz? Şantiyeye bağlı veriler doğrudan silinmez ancak listelerden gizlenir."
    />

    <GuideDrawer 
      isOpen={helpOpen} 
      onClose={() => setHelpOpen(false)} 
      title={t('projects.help_title')} 
      desc={t('projects.help_desc')} 
      h1={t('projects.help_h1')} 
      p1={t('projects.help_p1')} 
      h2={t('projects.help_h2')} 
      p2={t('projects.help_p2')} 
      h3={t('projects.help_h3')} 
      p3={t('projects.help_p3')} 
    />
    </>
  );
};

export default ProjectManagement;
