import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';
import GuideDrawer from './ui/GuideDrawer';
import { formatCurrency, getCurrencySymbol } from '../utils/formatUtils';

const SubcontractorLedger = ({ activeProjectId, projects = [] }) => {
  const { t, i18n } = useTranslation();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const containerRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    service_type: '',
    phone: '',
    daily_wage: '',
    status: 'active'
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const handleStartEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      service_type: c.service_type,
      phone: c.phone || '',
      daily_wage: c.daily_wage.toString(),
      status: c.status || 'active'
    });
  };

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'active' | 'passive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filterStatus]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const fetchContractors = async () => {
    if (!activeProjectId) return;
    if (window.api && window.api.db) {
      setLoading(true);
      const data = await window.api.db.read('subcontractor_ledgers', { project_id: activeProjectId });
      setContractors(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, [activeProjectId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !formData.name || !formData.service_type || !formData.daily_wage) return;

    if (window.api && window.api.db) {
      const payload = {
        project_id: activeProjectId,
        name: formData.name,
        service_type: formData.service_type,
        phone: formData.phone,
        daily_wage: Number(formData.daily_wage),
        status: formData.status
      };

      if (editingId) {
        await window.api.db.update('subcontractor_ledgers', editingId, payload);
        setEditingId(null);
      } else {
        await window.api.db.create('subcontractor_ledgers', payload);
      }

      setFormData({
        name: '',
        service_type: '',
        phone: '',
        daily_wage: '',
        status: 'active'
      });
      fetchContractors();
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (window.api && window.api.db && confirmModal.id) {
      await window.api.db.delete('subcontractor_ledgers', confirmModal.id);
      setConfirmModal({ isOpen: false, id: null });
      fetchContractors();
    }
  };

  // Filter and paginated subcontractors
  const filteredContractors = contractors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.phone && c.phone.includes(searchQuery));
    const matchesStatus = !filterStatus || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Apply sorting
  filteredContractors.sort((a, b) => {
    if (sortBy === 'wage_asc') {
      const wageA = a.daily_wage ? parseFloat(a.daily_wage) : 0;
      const wageB = b.daily_wage ? parseFloat(b.daily_wage) : 0;
      return wageA - wageB;
    } else if (sortBy === 'wage_desc') {
      const wageA = a.daily_wage ? parseFloat(a.daily_wage) : 0;
      const wageB = b.daily_wage ? parseFloat(b.daily_wage) : 0;
      return wageB - wageA;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredContractors.length / itemsPerPage);
  const paginatedContractors = filteredContractors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>{t('nav.subcontractors', 'Taşeron Cari Takibi')}</h2>
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
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('subcontractor.title', '🚜 Taşeron ve Alt Yüklenici Carileri')}</h2>
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

        {/* Add Record Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('subcontractor.name', 'Taşeron Adı / Ünvanı')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('subcontractor.name_ph', 'Örn: Öz Karadeniz Hafriyat')} 
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('subcontractor.service', 'Hizmet Alanı')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('subcontractor.service_ph', 'Örn: Kepçe Kiralama / Hafriyat')} 
              value={formData.service_type}
              onChange={e => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('common.phone', 'Telefon')}</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('worker_modal.phone_ph', '05XX XXX XX XX')} 
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              {t('subcontractor.wage', 'Yevmiye / Günlük Bedel (₺)').includes('(₺)')
                ? t('subcontractor.wage', 'Yevmiye / Günlük Bedel (₺)').replace('(₺)', `(${getCurrencySymbol(i18n.language)})`)
                : `${t('subcontractor.wage', 'Yevmiye / Günlük Bedel (₺)')} (${getCurrencySymbol(i18n.language)})`}
            </label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="0.00" 
              min="0"
              value={formData.daily_wage}
              onChange={e => setFormData(prev => ({ ...prev, daily_wage: e.target.value }))}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', height: '42px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '42px' }}>
              {editingId ? t('common.save', 'Güncelle') : t('common.add', 'Ekle')}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn" 
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    service_type: '',
                    phone: '',
                    daily_wage: '',
                    status: 'active'
                  });
                }}
                style={{ height: '42px' }}
              >
                {t('common.cancel', 'Vazgeç')}
              </button>
            )}
          </div>
        </form>

        {/* Filters & Search Bar */}
        {contractors.length > 0 && (
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
                placeholder={t('filters.search_subcontractors', 'Taşeron adı, hizmet veya telefonda ara...')}
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
              <option value="default">{t('filters.default_sort', 'Varsayılan Sıralama')}</option>
              <option value="wage_asc">{t('filters.wage_asc', 'Günlük Ücret: Artan')}</option>
              <option value="wage_desc">{t('filters.wage_desc', 'Günlük Ücret: Azalan')}</option>
            </select>

            <select 
              className="form-input" 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}
            >
              <option value="">{t('filters.all_status', 'Tümü (Durum)')}</option>
              <option value="active">{t('filters.active', 'Aktif')}</option>
              <option value="passive">{t('filters.passive', 'Pasif')}</option>
            </select>
          </div>
        )}

        {/* Contractors List */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : filteredContractors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {searchQuery ? t('subcontractor.no_results', 'Arama kriterlerine uygun taşeron kaydı bulunamadı.') : t('empty.subcontractor', 'Bu şantiye için henüz taşeron kaydedilmemiş.')}
          </div>
        ) : (
          <div className="fin-table-container">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>{t('subcontractor.table_name', 'Taşeron / Firma')}</th>
                  <th>{t('subcontractor.service', 'Hizmet Alanı')}</th>
                  <th>{t('common.phone', 'Telefon')}</th>
                  <th style={{ textAlign: 'right' }}>{t('subcontractor.table_wage', 'Günlük Bedel')}</th>
                  <th>{t('subcontractor.table_status', 'Durum')}</th>
                  <th style={{ textAlign: 'right' }}>{t('subcontractor.table_action', 'İşlem')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContractors.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600' }}>{c.name}</td>
                    <td>{c.service_type}</td>
                    <td>{c.phone || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(c.daily_wage, i18n.language)}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        background: c.status === 'passive' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                        color: c.status === 'passive' ? 'var(--danger)' : 'var(--success)' 
                      }}>
                        {c.status === 'passive' ? t('filters.passive', 'PASİF') : t('filters.active', 'AKTİF')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn" 
                          onClick={() => handleStartEdit(c)}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          {t('dashboard.edit', 'Düzenle')}
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(c.id)}
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

      <GuideDrawer 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        title={t('guides.subcontractor.title')} 
        desc="" 
        h1={t('guides.subcontractor.step1.title')} 
        p1={t('guides.subcontractor.step1.desc')} 
        h2={t('guides.subcontractor.step2.title')} 
        p2={t('guides.subcontractor.step2.desc')} 
        h3={t('guides.subcontractor.step3.title')} 
        p3={t('guides.subcontractor.step3.desc')} 
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title={t('subcontractor.delete_title', 'Taşeronu Sil')}
        message={t('subcontractor.delete_confirm', 'Bu taşeron kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')}
      />
    </div>
  );
};

export default SubcontractorLedger;
