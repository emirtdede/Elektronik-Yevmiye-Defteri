import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';

const SubcontractorLedger = ({ activeProjectId, projects = [] }) => {
  const { t } = useTranslation();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    service_type: '',
    phone: '',
    daily_wage: '',
    status: 'active'
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !formData.name || !formData.service_type || !formData.daily_wage) return;

    if (window.api && window.api.db) {
      await window.api.db.create('subcontractor_ledgers', {
        project_id: activeProjectId,
        name: formData.name,
        service_type: formData.service_type,
        phone: formData.phone,
        daily_wage: Number(formData.daily_wage),
        status: formData.status
      });
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

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>{t('nav.subcontractors', 'Taşeron Cari Takibi')}</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>{t('common.select_project_msg', 'Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
      {/* Main List and Form */}
      <div className="glass-card">
        <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🚜 Taşeron ve Alt Yüklenici Carileri</h2>
        <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Aktif Şantiye: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>

        {/* Add Record Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Taşeron Adı / Ünvanı</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Örn: Öz Karadeniz Hafriyat" 
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hizmet Alanı</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Örn: Kepçe Kiralama / Hafriyat" 
              value={formData.service_type}
              onChange={e => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Telefon</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="05XX XXX XX XX" 
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Yevmiye / Günlük Bedel (₺)</label>
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
          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Ekle</button>
        </form>

        {/* Contractors List */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : contractors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Bu şantiyeye kayıtlı taşeron/alt yüklenici bulunamadı.
          </div>
        ) : (
          <div className="fin-table-container">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Taşeron / Firma</th>
                  <th>Hizmet Alanı</th>
                  <th>Telefon</th>
                  <th style={{ textAlign: 'right' }}>Günlük Bedel</th>
                  <th>Durum</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {contractors.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600' }}>{c.name}</td>
                    <td>{c.service_type}</td>
                    <td>{c.phone || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{c.daily_wage} ₺</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                        AKTİF
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDelete(c.id)}
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

      {/* Side Help Card */}
      <div className="glass-card">
        <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>💡 Taşeron Yönetimi</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Taşeron ve Alt Yüklenici modülü, sahada yevmiyeli veya kiralık hizmet veren dış firmaların/şahısların günlük yevmiye bedellerini ve iletişim detaylarını arşivlemenizi sağlar.
        </p>
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Taşeronu Sil"
        message="Bu taşeron kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
};

export default SubcontractorLedger;
