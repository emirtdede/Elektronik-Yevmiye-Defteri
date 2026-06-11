import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';

const QualityReports = ({ activeProjectId, projects = [] }) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    photo_path: '',
    report_date: new Date().toISOString().split('T')[0]
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [qrModal, setQrModal] = useState({ isOpen: false, qrCode: '', url: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const activeProject = projects.find(p => p.id === activeProjectId);

  const fetchReports = async () => {
    if (!activeProjectId) return;
    if (window.api && window.api.db) {
      setLoading(true);
      const data = await window.api.db.read('quality_reports', { project_id: activeProjectId });
      setReports(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeProjectId]);

  // Listen for LAN photo uploads
  useEffect(() => {
    if (window.api && window.api.system.onPhotoUploaded) {
      const unsubscribe = window.api.system.onPhotoUploaded((data) => {
        if (data.projectId == activeProjectId) {
          setFormData(prev => ({ ...prev, photo_path: data.relativePath }));
          loadPhotoPreview(data.relativePath);
          alert('✓ Mobil cihazdan çekilen fotoğraf başarıyla alındı!');
          setQrModal({ isOpen: false, qrCode: '', url: '' });
          window.api.system.stopLANServer();
        }
      });
      return () => unsubscribe();
    }
  }, [activeProjectId]);

  const loadPhotoPreview = async (relativePath) => {
    if (window.api && window.api.media.readPhoto && relativePath) {
      const res = await window.api.media.readPhoto({ relativePath });
      if (res.success) {
        setPhotoPreview(res.base64);
      }
    }
  };

  const handleSelectLocalPhoto = async () => {
    if (window.api && window.api.media.selectPhoto && window.api.media.savePhoto) {
      const res = await window.api.media.selectPhoto();
      if (res.success && res.filePath) {
        const saveRes = await window.api.media.savePhoto({ projectId: activeProjectId, filePath: res.filePath });
        if (saveRes.success) {
          setFormData(prev => ({ ...prev, photo_path: saveRes.relativePath }));
          loadPhotoPreview(saveRes.relativePath);
        }
      }
    }
  };

  const handleOpenQRModal = async () => {
    if (window.api && window.api.system.startLANServer && activeProject) {
      const res = await window.api.system.startLANServer({
        projectId: activeProjectId,
        projectName: activeProject.name
      });
      if (res.success) {
        setQrModal({
          isOpen: true,
          qrCode: res.qrCodeDataUrl,
          url: res.url
        });
      } else {
        alert('Yerel sunucu başlatılamadı: ' + res.message);
      }
    }
  };

  const handleCloseQRModal = () => {
    setQrModal({ isOpen: false, qrCode: '', url: '' });
    if (window.api && window.api.system.stopLANServer) {
      window.api.system.stopLANServer();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !formData.title) return;

    if (window.api && window.api.db) {
      await window.api.db.create('quality_reports', {
        project_id: activeProjectId,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        photo_path: formData.photo_path,
        report_date: formData.report_date
      });
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        status: 'open',
        photo_path: ''
      }));
      setPhotoPreview('');
      fetchReports();
    }
  };

  const handleToggleStatus = async (report) => {
    if (window.api && window.api.db) {
      const nextStatus = report.status === 'open' ? 'resolved' : 'open';
      await window.api.db.update('quality_reports', report.id, { status: nextStatus });
      fetchReports();
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (window.api && window.api.db && confirmModal.id) {
      await window.api.db.delete('quality_reports', confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      fetchReports();
    }
  };

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>Kalite Kontrol Tutanakları</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
      {/* Main List and Form */}
      <div className="glass-card">
        <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🛡️ Kalite Kontrol & Şantiye Tutanakları</h2>
        <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Aktif Şantiye: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>

        {/* Add Record Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Tutanak / Tespit Başlığı</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Örn: 3. Kat Aks Kayması / Hatalı Kalıp Kurulumu" 
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tarih</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.report_date}
              onChange={e => setFormData(prev => ({ ...prev, report_date: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Başlangıç Durumu</label>
            <select 
              className="form-input" 
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="open">AÇIK (Sorun Çözülmedi)</option>
              <option value="resolved">ÇÖZÜLDÜ (Kapatıldı)</option>
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Görsel / Tutanak Fotoğrafı</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn" onClick={handleSelectLocalPhoto} style={{ flex: 1, fontSize: '0.85rem' }}>
                📂 PC'den Seç
              </button>
              <button type="button" className="btn btn-primary" onClick={handleOpenQRModal} style={{ flex: 1, fontSize: '0.85rem' }}>
                📲 Mobilden Yükle (QR)
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Detaylı Açıklama</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tespit edilen aksaklığın ayrıntıları..." 
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Tutanak Ekle</button>
        </form>

        {/* Tutanak List */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Henüz şantiye kalite kontrol tutanağı bulunmuyor.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map(rep => (
              <div 
                key={rep.id} 
                className="glass-card" 
                style={{ 
                  padding: '1.25rem',
                  borderLeft: rep.status === 'resolved' ? '4px solid var(--success)' : '4px solid var(--danger)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 className="card-title" style={{ fontSize: '1.05rem' }}>{rep.title}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📅 {rep.report_date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span 
                      onClick={() => handleToggleStatus(rep)}
                      style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: '700', 
                        cursor: 'pointer',
                        padding: '3px 10px', 
                        borderRadius: '12px',
                        background: rep.status === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: rep.status === 'resolved' ? 'var(--success)' : 'var(--danger)',
                        border: rep.status === 'resolved' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      {rep.status === 'resolved' ? '✓ ÇÖZÜLDÜ' : '⚠️ AÇIK (Çözülmedi)'}
                    </span>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete(rep.id)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
                {rep.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{rep.description}</p>}
                
                {rep.photo_path && (
                  <span 
                    style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline', fontSize: '0.85rem' }}
                    onClick={async () => {
                      const res = await window.api.media.readPhoto({ relativePath: rep.photo_path });
                      if (res.success) {
                        const newWindow = window.open();
                        newWindow.document.write(`<img src="${res.base64}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                      }
                    }}
                  >
                    👁️ Tutanak Görselini Aç
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Preview Pane */}
      <div className="glass-card">
        <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🖼️ Görsel Önizleme</h3>
        {photoPreview ? (
          <div style={{ position: 'relative' }}>
            <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem' }} />
            <button 
              className="btn btn-danger"
              style={{ position: 'absolute', top: '5px', right: '5px', padding: '0.2rem 0.4rem', borderRadius: '50%', fontSize: '0.75rem' }}
              onClick={() => { setPhotoPreview(''); setFormData(prev => ({ ...prev, photo_path: '' })); }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
            Eklenen fotoğraf yok. Üst kısımdan dosya yükleyebilirsiniz.
          </div>
        )}
      </div>

      {/* QR Code Modal for LAN Uploads */}
      {qrModal.isOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={handleCloseQRModal}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '90%', padding: '2rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📲 Tutanak Fotoğrafı Yükle</h3>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Telefonunuzu **aynı WiFi ağına** bağlayıp aşağıdaki QR kodu okutun:</p>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
              <img src={qrModal.qrCode} alt="LAN QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: '0.5rem' }}>
              URL: <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{qrModal.url}</code>
            </div>
            <button className="btn btn-danger" onClick={handleCloseQRModal} style={{ width: '100%', marginTop: '1.5rem' }}>İptal Et</button>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Tutanak Sil"
        message="Bu kalite kontrol tutanağını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
};

export default QualityReports;
