import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const MediaGallery = ({ activeProjectId, projects = [] }) => {
  const { t } = useTranslation();
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const fetchMedia = async () => {
    if (!activeProjectId) return;
    setLoading(true);
    if (window.api && window.api.db) {
      const materials = await window.api.db.read('materials', { project_id: activeProjectId });
      const reports = await window.api.db.read('quality_reports', { project_id: activeProjectId });

      const items = [];

      // Process materials photos
      for (const m of materials) {
        if (m.photo_path) {
          items.push({
            id: `material_${m.id}`,
            type: 'İrsaliye / Fiş',
            title: `${m.supplier} - ${m.material_type}`,
            date: m.receipt_date,
            photo_path: m.photo_path
          });
        }
      }

      // Process quality reports photos
      for (const r of reports) {
        if (r.photo_path) {
          items.push({
            id: `report_${r.id}`,
            type: 'Kalite Tutanak',
            title: r.title,
            date: r.report_date,
            photo_path: r.photo_path
          });
        }
      }

      // Read base64 content for each
      const resolvedItems = [];
      for (const item of items) {
        const res = await window.api.media.readPhoto({ relativePath: item.photo_path });
        if (res.success) {
          resolvedItems.push({
            ...item,
            base64: res.base64
          });
        }
      }

      setMediaItems(resolvedItems);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [activeProjectId]);

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>{t('nav.media', 'Medya Galerisi')}</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>{t('common.select_project_msg', 'Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷 Şantiye Medya Galerisi</h2>
      <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Aktif Şantiye: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map(n => <div key={n} className="skeleton" style={{ height: '180px', borderRadius: '12px' }}></div>)}
        </div>
      ) : mediaItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Bu şantiyeye ait herhangi bir evrak veya tutanak fotoğrafı bulunamadı.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {mediaItems.map(item => (
            <div 
              key={item.id} 
              className="glass-card" 
              style={{ padding: '0.5rem', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setSelectedImage(item.base64)}
            >
              <img 
                src={item.base64} 
                alt={item.title} 
                style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} 
              />
              <div style={{ padding: '0.5rem 0.25rem 0.25rem 0.25rem' }}>
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: '700', 
                  color: item.type === 'Kalite Tutanak' ? 'var(--danger)' : 'var(--success)',
                  background: item.type === 'Kalite Tutanak' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {item.type}
                </span>
                <h4 style={{ fontSize: '0.85rem', margin: '0.5rem 0 0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>
                  {item.title}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {item.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Fullscreen Modal */}
      {selectedImage && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.85)' }} onClick={() => setSelectedImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90vh' }}>
            <img src={selectedImage} alt="Fullscreen View" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }} />
            <button 
              className="btn btn-danger" 
              style={{ position: 'absolute', top: '-15px', right: '-15px', padding: '0.3rem 0.6rem', borderRadius: '50%' }}
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
