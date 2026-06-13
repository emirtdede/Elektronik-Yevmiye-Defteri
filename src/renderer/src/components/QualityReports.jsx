import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';
import CustomDatePicker from './ui/CustomDatePicker';
import LightboxModal from './ui/LightboxModal';
import { compressImage } from '../utils/imageCompressor';
import GuideDrawer from './ui/GuideDrawer';

const QualityReports = ({ activeProjectId, projects = [] }) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
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
    title: '',
    description: '',
    status: 'open',
    photo_path: '',
    report_date: todayStr
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [qrModal, setQrModal] = useState({ isOpen: false, qrCode: '', url: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [lightboxImage, setLightboxImage] = useState(null);

  const handleStartEdit = (rep) => {
    setEditingId(rep.id);
    setFormData({
      title: rep.title,
      description: rep.description || '',
      status: rep.status,
      photo_path: rep.photo_path || '',
      report_date: rep.report_date
    });
    if (rep.photo_path) {
      loadPhotoPreview(rep.photo_path);
    } else {
      setPhotoPreview('');
    }
  };

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterPhoto, setFilterPhoto] = useState(''); // '' | 'yes' | 'no'
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'open' | 'resolved'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filterPhoto, filterStatus]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const handleSelectLocalPhoto = () => {
    document.getElementById('local-quality-photo-input').click();
  };

  const handleLocalFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const compressedBase64 = await compressImage(e.target.files[0]);
        if (window.api && window.api.media.savePhotoBase64) {
          const saveRes = await window.api.media.savePhotoBase64({ 
            projectId: activeProjectId, 
            base64Data: compressedBase64 
          });
          if (saveRes.success) {
            setFormData(prev => ({ ...prev, photo_path: saveRes.relativePath }));
            setPhotoPreview(compressedBase64);
          } else {
            alert('Fotoğraf kaydedilemedi: ' + saveRes.message);
          }
        }
      } catch (err) {
        alert('Fotoğraf işlenirken hata oluştu: ' + err.message);
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
      const payload = {
        project_id: activeProjectId,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        photo_path: formData.photo_path,
        report_date: formData.report_date
      };

      if (editingId) {
        await window.api.db.update('quality_reports', editingId, payload);
        setEditingId(null);
      } else {
        await window.api.db.create('quality_reports', payload);
      }

      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        status: 'open',
        photo_path: '',
        report_date: todayStr
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

  // Filter and paginated reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          r.report_date.includes(searchQuery);
    const matchesPhoto = !filterPhoto || 
                         (filterPhoto === 'yes' && !!r.photo_path) || 
                         (filterPhoto === 'no' && !r.photo_path);
    const matchesStatus = !filterStatus || r.status === filterStatus;
    return matchesSearch && matchesPhoto && matchesStatus;
  });

  // Apply sorting
  filteredReports.sort((a, b) => {
    if (sortBy === 'date_desc') {
      return b.report_date.localeCompare(a.report_date);
    } else if (sortBy === 'date_asc') {
      return a.report_date.localeCompare(b.report_date);
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>{t('nav.quality', 'Kalite Kontrol Tutanakları')}</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>{t('common.select_project_msg', 'Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.')}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Main List and Form */}
      <div className="glass-card" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>{t('quality.title', '🛡️ Kalite Kontrol & Şantiye Tutanakları')}</h2>
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
        <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>{t('common.active_project', 'Aktif Şantiye:')} <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>

        {/* Add Record Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 3' }}>
            <label className="form-label">{t('quality.report_title', 'Tutanak / Tespit Başlığı')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('quality.report_title_ph', 'Örn: 3. Kat Aks Kayması / Hatalı Kalıp Kurulumu')} 
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 1' }}>
            <label className="form-label">{t('common.date', 'Tarih')}</label>
            <CustomDatePicker 
              className="form-input"
              value={formData.report_date} 
              onChange={e => setFormData(prev => ({ ...prev, report_date: e.target.value }))} 
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">{t('quality.initial_status', 'Başlangıç Durumu')}</label>
            <select 
              className="form-input" 
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="open">{t('quality.status_open', 'AÇIK (Sorun Çözülmedi)')}</option>
              <option value="resolved">{t('filters.status_resolved', 'ÇÖZÜLDÜ (Kapatıldı)')}</option>
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">{t('quality.photo_label', 'Görsel / Tutanak Fotoğrafı')}</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button type="button" className="btn" onClick={handleSelectLocalPhoto} style={{ flex: 1, fontSize: '0.85rem' }}>
                {t('quality.select_pc', '📂 PC\'den Seç')}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleOpenQRModal} style={{ flex: 1, fontSize: '0.85rem' }}>
                {t('quality.upload_mobile', '📲 Mobilden Yükle (QR)')}
              </button>
              {photoPreview && (
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '45px', 
                    height: '38px', 
                    flexShrink: 0, 
                    borderRadius: '6px', 
                    overflow: 'hidden', 
                    border: '1px solid var(--glass-border)', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }} 
                  onClick={() => setLightboxImage(photoPreview)}
                >
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button"
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      right: 0, 
                      background: 'rgba(239, 68, 68, 0.9)', 
                      color: 'white', 
                      border: 'none', 
                      width: '14px', 
                      height: '14px', 
                      borderRadius: '50%', 
                      fontSize: '9px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer', 
                      padding: 0 
                    }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setPhotoPreview(''); 
                      setFormData(prev => ({ ...prev, photo_path: '' })); 
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <input 
              type="file" 
              id="local-quality-photo-input" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleLocalFileChange} 
            />
          </div>
 
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 5' }}>
            <label className="form-label">{t('quality.detailed_description', 'Detaylı Açıklama')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('quality.description_ph', 'Tespit edilen aksaklığın ayrıntıları...')} 
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', gridColumn: 'span 3' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '42px' }}>
              {editingId ? t('common.save', 'Tutanak Güncelle') : t('quality.add_report', 'Tutanak Ekle')}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn" 
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    description: '',
                    status: 'open',
                    photo_path: '',
                    report_date: todayStr
                  });
                  setPhotoPreview('');
                }}
                style={{ height: '42px' }}
              >
                {t('common.cancel', 'Vazgeç')}
              </button>
            )}
          </div>
        </form>

        {/* Filters & Search Bar */}
        {reports.length > 0 && (
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
                placeholder={t('filters.search_reports', 'Tutanak başlıklarında, açıklamalarda veya tarihte ara...')}
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
              style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}
            >
              <option value="date_desc">{t('filters.newest', 'Tarih: Yeniden Eskiye')}</option>
              <option value="date_asc">{t('filters.oldest', 'Tarih: Eskiden Yeniye')}</option>
            </select>

            <select 
              className="form-input" 
              value={filterPhoto} 
              onChange={e => setFilterPhoto(e.target.value)}
              style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}
            >
              <option value="">{t('filters.photo_all', 'Tümü (Fotoğraf)')}</option>
              <option value="yes">{t('filters.with_photo', 'Fotoğraflı')}</option>
              <option value="no">{t('filters.without_photo', 'Fotoğrafsız')}</option>
            </select>

            <select 
              className="form-input" 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}
            >
              <option value="">{t('filters.status_all', 'Tümü (Durum)')}</option>
              <option value="open">{t('quality.status_open', 'Açık (Çözülmedi)')}</option>
              <option value="resolved">{t('filters.status_resolved', 'Çözüldü')}</option>
            </select>
          </div>
        )}

        {/* Tutanak List */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {searchQuery ? t('quality.no_results', 'Arama kriterlerine uygun tutanak kaydı bulunamadı.') : t('quality.empty_state', 'Henüz şantiye kalite kontrol tutanağı bulunmuyor.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paginatedReports.map(rep => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                      {rep.status === 'resolved' ? `✓ ${t('filters.status_resolved', 'ÇÖZÜLDÜ')}` : `⚠️ ${t('quality.status_open', 'AÇIK (Sorun Çözülmedi)')}`}
                    </span>
                    {rep.report_date === todayStr && (
                      <button 
                        className="btn" 
                        onClick={() => handleStartEdit(rep)}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        {t('dashboard.edit', 'Düzenle')}
                      </button>
                    )}
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete(rep.id)}
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      {t('common.delete', 'Sil')}
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
                        setLightboxImage(res.base64);
                      }
                    }}
                  >
                    👁️ {t('quality.open_photo', 'Tutanak Görselini Aç')}
                  </span>
                )}
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

      {/* QR Code Pop-up Modal (Centered, Glassmorphism Backdrop Blur) */}
      {qrModal.isOpen && (
        <div 
          className="drawer-overlay" 
          style={{ 
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            backdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(15, 23, 42, 0.75)'
          }} 
          onClick={handleCloseQRModal}
        >
          <div 
            className="glass-card" 
            style={{ 
              maxWidth: '400px', 
              width: '90%', 
              padding: '2.5rem 2rem', 
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              borderRadius: '20px'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <h3 className="card-title" style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>📲 {t('quality.upload_mobile_title', 'Tutanak Fotoğrafı Yükle')}</h3>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {t('quality.upload_mobile_desc', 'Telefonunuzu **aynı WiFi ağına** bağlayıp aşağıdaki QR kodu okutun:')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', width: '212px', height: '212px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={qrModal.qrCode} alt="LAN QR Code" style={{ width: '180px', height: '180px', display: 'block', objectFit: 'contain' }} />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              URL: <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{qrModal.url}</code>
            </div>
            <button className="btn btn-danger" onClick={handleCloseQRModal} style={{ width: '100%', marginTop: '1.5rem', height: '42px', fontWeight: 'bold' }}>{t('common.cancel', 'İptal Et')}</button>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      <LightboxModal 
        isOpen={!!lightboxImage} 
        imageSrc={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title={t('quality.delete_title', 'Tutanak Sil')}
        message={t('quality.delete_confirm', 'Bu kalite kontrol tutanağını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')}
      />

      <GuideDrawer 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        title={t('quality.help_title')} 
        desc={t('quality.help_desc')} 
        h1={t('quality.help_h1')} 
        p1={t('quality.help_p1')} 
        h2={t('quality.help_h2')} 
        p2={t('quality.help_p2')} 
        h3={t('quality.help_h3')} 
        p3={t('quality.help_p3')} 
      />
    </div>
  );
};

export default QualityReports;
