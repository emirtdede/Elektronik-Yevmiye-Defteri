import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';

const MaterialManagement = ({ activeProjectId, projects = [] }) => {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    supplier: '',
    material_type: '',
    quantity: '',
    unit: 'm³',
    receipt_number: '',
    receipt_date: new Date().toISOString().split('T')[0],
    photo_path: '',
    notes: ''
  });
  
  const [photoPreview, setPhotoPreview] = useState('');
  const [qrModal, setQrModal] = useState({ isOpen: false, qrCode: '', url: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const activeProject = projects.find(p => p.id === activeProjectId);

  const fetchRecords = async () => {
    if (!activeProjectId) return;
    if (window.api && window.api.db) {
      setLoading(true);
      const data = await window.api.db.read('materials', { project_id: activeProjectId });
      setRecords(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeProjectId]);

  // Listen for LAN photo uploads
  useEffect(() => {
    if (window.api && window.api.system.onPhotoUploaded) {
      const unsubscribe = window.api.system.onPhotoUploaded((data) => {
        if (data.projectId == activeProjectId) {
          setFormData(prev => ({ ...prev, photo_path: data.relativePath }));
          loadPhotoPreview(data.relativePath);
          // Show alert and close QR Modal
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
    if (!activeProjectId || !formData.supplier || !formData.material_type || !formData.quantity) return;

    if (window.api && window.api.db) {
      await window.api.db.create('materials', {
        project_id: activeProjectId,
        supplier: formData.supplier,
        material_type: formData.material_type,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        receipt_number: formData.receipt_number,
        receipt_date: formData.receipt_date,
        photo_path: formData.photo_path,
        notes: formData.notes
      });
      setFormData(prev => ({
        ...prev,
        supplier: '',
        material_type: '',
        quantity: '',
        receipt_number: '',
        photo_path: '',
        notes: ''
      }));
      setPhotoPreview('');
      fetchRecords();
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (window.api && window.api.db && confirmModal.id) {
      await window.api.db.delete('materials', confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      fetchRecords();
    }
  };

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>İrsaliye & Malzeme Takibi</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
      {/* Main List and Form */}
      <div className="glass-card">
        <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📄 İrsaliye ve Malzeme Girişleri</h2>
        <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Aktif Şantiye: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>

        {/* Add Record Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tedarikçi Şirket</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Örn: Limak Çimento" 
              value={formData.supplier}
              onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Malzeme Türü</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Örn: C30 Hazır Beton" 
              value={formData.material_type}
              onChange={e => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Miktar</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="0.00" 
              min="0.01" 
              step="0.01"
              value={formData.quantity}
              onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Birim</label>
            <select 
              className="form-input" 
              value={formData.unit}
              onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            >
              <option value="m³">m³</option>
              <option value="ton">ton</option>
              <option value="kg">kg</option>
              <option value="adet">adet</option>
              <option value="m²">m²</option>
              <option value="mt">mt</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">İrsaliye / Fiş No</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="IRS-998822" 
              value={formData.receipt_number}
              onChange={e => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tarih</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.receipt_date}
              onChange={e => setFormData(prev => ({ ...prev, receipt_date: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Evrak Fotoğrafı</label>
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
            <label className="form-label">Açıklama / Not</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ek notlar..." 
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Kaydet</button>
        </form>

        {/* Records List */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Henüz malzeme/irsaliye kaydı bulunmuyor.
          </div>
        ) : (
          <div className="fin-table-container">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Evrak / Fiş No</th>
                  <th>Tedarikçi</th>
                  <th>Malzeme</th>
                  <th style={{ textAlign: 'right' }}>Miktar</th>
                  <th>Fotoğraf</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{r.receipt_date}</td>
                    <td style={{ fontWeight: '600' }}>{r.receipt_number || '-'}</td>
                    <td>{r.supplier}</td>
                    <td>{r.material_type}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>
                      {r.quantity} {r.unit}
                    </td>
                    <td>
                      {r.photo_path ? (
                        <span 
                          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline' }}
                          onClick={async () => {
                            const res = await window.api.media.readPhoto({ relativePath: r.photo_path });
                            if (res.success) {
                              const newWindow = window.open();
                              newWindow.document.write(`<img src="${res.base64}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                            }
                          }}
                        >
                          👁️ Görüntüle
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Yok</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDelete(r.id)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Preview Pane */}
      <div className="glass-card">
        <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🖼️ Seçili Evrak Önizlemesi</h3>
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
            Önizlenecek fotoğraf yok. Üst kısımdan dosya ekleyebilirsiniz.
          </div>
        )}
      </div>

      {/* QR Code Modal for LAN Uploads */}
      {qrModal.isOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={handleCloseQRModal}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '90%', padding: '2rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📲 Mobil Fotoğraf Yükle</h3>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Telefonunuzu ve bilgisayarınızı **aynı WiFi ağına** bağlayın, ardından aşağıdaki QR kodu kameranızla taratın:</p>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
              <img src={qrModal.qrCode} alt="LAN QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: '0.5rem', userSelect: 'all' }}>
              Bağlantı adresi: <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{qrModal.url}</code>
            </div>
            <button className="btn btn-danger" onClick={handleCloseQRModal} style={{ width: '100%', marginTop: '1.5rem' }}>İptal Et</button>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Evrak Sil"
        message="Bu irsaliye kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
};

export default MaterialManagement;
