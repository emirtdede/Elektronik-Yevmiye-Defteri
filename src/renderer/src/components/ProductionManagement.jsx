import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';
import CustomDatePicker from './ui/CustomDatePicker';
import GuideDrawer from './ui/GuideDrawer';
import { formatDate } from '../utils/formatUtils';

const ProductionManagement = ({ activeProjectId, projects = [] }) => {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit mode state
  const [editingId, setEditingId] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const containerRef = useRef(null);

  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'm²',
    record_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const handleStartDateChange = (val) => {
    if (val && filterEndDate && new Date(val) > new Date(filterEndDate)) {
      setFilterStartDate(filterEndDate);
      setFilterEndDate(val);
    } else {
      setFilterStartDate(val);
    }
  };
  const handleEndDateChange = (val) => {
    if (val && filterStartDate && new Date(filterStartDate) > new Date(val)) {
      setFilterEndDate(filterStartDate);
      setFilterStartDate(val);
    } else {
      setFilterEndDate(val);
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const activeProject = projects.find(p => p.id === activeProjectId);

  const fetchRecords = async () => {
    if (!activeProjectId) return;
    if (window.api && window.api.db) {
      setLoading(true);
      const data = await window.api.db.read('production_records', { project_id: activeProjectId });
      setRecords(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeProjectId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterUnit, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const handleStartEdit = (r) => {
    setEditingId(r.id);
    setFormData({
      item_name: r.item_name,
      quantity: r.quantity,
      unit: r.unit,
      record_date: r.record_date,
      notes: r.notes || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !formData.item_name || !formData.quantity) return;

    if (window.api && window.api.db) {
      const payload = {
        project_id: activeProjectId,
        item_name: formData.item_name,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        record_date: formData.record_date,
        notes: formData.notes
      };

      if (editingId) {
        await window.api.db.update('production_records', editingId, payload);
        setEditingId(null);
      } else {
        await window.api.db.create('production_records', payload);
      }

      setFormData(prev => ({
        ...prev,
        item_name: '',
        quantity: '',
        notes: ''
      }));
      fetchRecords();
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (window.api && window.api.db && confirmModal.id) {
      await window.api.db.delete('production_records', confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      fetchRecords();
    }
  };

  // Filter and paginated records
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesUnit = !filterUnit || r.unit === filterUnit;
    let matchesDate = true;
    if (filterStartDate) matchesDate = matchesDate && r.record_date >= filterStartDate;
    if (filterEndDate) matchesDate = matchesDate && r.record_date <= filterEndDate;
    return matchesSearch && matchesUnit && matchesDate;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>{t('nav.production', 'İmalat & Metraj Takibi')}</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>{t('common.select_project_msg', 'Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.')}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Main List and Form */}
      <div className="glass-card" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>{t('production.title', '📐 Metraj ve İmalat Takibi')}</h2>
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
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('production.item_name', 'İmalat Kalemi')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('production.item_name_ph', 'Örn: Tuğla Duvar Örme')} 
              value={formData.item_name}
              onChange={e => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('common.quantity', 'Miktar')}</label>
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
            <label className="form-label">{t('common.unit', 'Birim')}</label>
            <select 
              className="form-input" 
              value={formData.unit}
              onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            >
              <option value="m²">m² (Metrekare)</option>
              <option value="m³">m³ (Metreküp)</option>
              <option value="mt">mt (Metretül)</option>
              <option value="ton">ton</option>
              <option value="kg">kg</option>
              <option value="adet">adet</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('common.date', 'Tarih')}</label>
            <CustomDatePicker 
              className="form-input" 
              value={formData.record_date}
              onChange={e => setFormData(prev => ({ ...prev, record_date: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">{t('common.notes', 'Açıklama / Not')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('common.notes_placeholder', 'Ek notlar...')} 
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', gridColumn: 'span 2' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '42px' }}>
              {editingId ? t('common.save', 'Güncelle') : t('common.save', 'Kaydet')}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn" 
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    item_name: '',
                    quantity: '',
                    unit: 'm²',
                    record_date: new Date().toISOString().split('T')[0],
                    notes: ''
                  });
                }} 
                style={{ height: '42px' }}
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>

        {/* Filters & Search Bar */}
        {records.length > 0 && (
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
                placeholder={t('filters.search_production', 'İmalat veya notlarda ara...')}
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
              value={filterUnit} 
              onChange={e => setFilterUnit(e.target.value)}
              style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}
            >
              <option value="">{t('filters.all_units', 'Tümü (Birim)')}</option>
              <option value="m²">m²</option>
              <option value="m³">m³</option>
              <option value="mt">mt</option>
              <option value="Adet">Adet</option>
              <option value="Kg">Kg</option>
              <option value="Ton">Ton</option>
            </select>

            <div style={{ flex: 1.2, minWidth: '160px' }}>
              <CustomDatePicker 
                className="form-input" 
                value={filterStartDate} 
                onChange={e => handleStartDateChange(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
            </div>

            <div style={{ flex: 1.2, minWidth: '160px' }}>
              <CustomDatePicker 
                className="form-input" 
                value={filterEndDate} 
                onChange={e => handleEndDateChange(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
        )}

        {/* Records Table */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {searchQuery ? t('production.no_results', 'Arama kriterlerine uygun imalat kaydı bulunamadı.') : t('empty.production', 'Bu şantiye için henüz bir imalat kaydı girilmemiş.')}
          </div>
        ) : (
          <div className="fin-table-container">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>{t('common.date', 'Tarih')}</th>
                  <th>{t('production.item_name', 'İmalat Kalemi')}</th>
                  <th style={{ textAlign: 'right' }}>{t('common.quantity', 'Miktar')}</th>
                  <th>{t('common.unit', 'Birim')}</th>
                  <th>{t('common.description', 'Açıklama')}</th>
                  <th style={{ textAlign: 'right' }}>{t('subcontractor.table_action', 'İşlem')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map(r => (
                  <tr key={r.id}>
                    <td>{formatDate(r.record_date, i18n.language)}</td>
                    <td style={{ fontWeight: '600' }}>{r.item_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--secondary)' }}>{r.quantity}</td>
                    <td>{r.unit}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.notes || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn" 
                          onClick={() => handleStartEdit(r)}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          {t('dashboard.edit', 'Düzenle')}
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(r.id)}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          {t('common.delete', 'Sil')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                position: 'sticky',
                bottom: 0,
                background: 'var(--option-bg, #0f172a)',
                borderTop: '1px solid var(--glass-border)',
                zIndex: 10,
                padding: '1rem',
                marginTop: '1.5rem',
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
        title={t('production.delete_title', 'Kaydı Sil')}
        message={t('production.delete_confirm', 'Bu imalat kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')}
      />

      <GuideDrawer 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        title={t('guides.quantity.title')} 
        desc="" 
        h1={t('guides.quantity.step1.title')} 
        p1={t('guides.quantity.step1.desc')} 
        h2={t('guides.quantity.step2.title')} 
        p2={t('guides.quantity.step2.desc')} 
        h3={t('guides.quantity.step3.title')} 
        p3={t('guides.quantity.step3.desc')} 
      />
    </div>
  );
};

export default ProductionManagement;
