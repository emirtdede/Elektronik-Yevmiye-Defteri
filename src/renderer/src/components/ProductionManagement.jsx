import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from './ui/ConfirmationModal';

const ProductionManagement = ({ activeProjectId, projects = [] }) => {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'm²',
    record_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !formData.item_name || !formData.quantity) return;

    if (window.api && window.api.db) {
      await window.api.db.create('production_records', {
        project_id: activeProjectId,
        item_name: formData.item_name,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        record_date: formData.record_date,
        notes: formData.notes
      });
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

  // Group by item name for summary widget
  const summaries = {};
  records.forEach(r => {
    const key = `${r.item_name} (${r.unit})`;
    summaries[key] = (summaries[key] || 0) + r.quantity;
  });

  if (!activeProjectId) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <h2>İmalat & Metraj Takibi</h2>
        <p className="text-muted" style={{ marginTop: '1rem' }}>{t('common.select_project_msg', 'Lütfen sol menüden veya Şantiye Yönetimi sayfasından aktif bir şantiye seçin.')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
      {/* Main List and Form */}
      <div className="glass-card">
        <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📐 Metraj ve İmalat Takibi</h2>
        <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Aktif Şantiye: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeProject?.name}</span></p>

        {/* Add Record Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">İmalat Kalemi</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Örn: Tuğla Duvar Örme" 
              value={formData.item_name}
              onChange={e => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
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
              <option value="m²">m² (Metrekare)</option>
              <option value="m³">m³ (Metreküp)</option>
              <option value="mt">mt (Metretül)</option>
              <option value="ton">ton</option>
              <option value="kg">kg</option>
              <option value="adet">adet</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tarih</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.record_date}
              onChange={e => setFormData(prev => ({ ...prev, record_date: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Açıklama / Not</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ek notlar veya açıklama..." 
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Kaydet</button>
        </form>

        {/* Records Table */}
        {loading ? (
          <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Bu şantiyeye ait henüz imalat kaydı girilmedi.
          </div>
        ) : (
          <div className="fin-table-container">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>İmalat Kalemi</th>
                  <th style={{ textAlign: 'right' }}>Miktar</th>
                  <th>Birim</th>
                  <th>Açıklama</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{r.record_date}</td>
                    <td style={{ fontWeight: '600' }}>{r.item_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--secondary)' }}>{r.quantity}</td>
                    <td>{r.unit}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.notes || '-'}</td>
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

      {/* Summary Box */}
      <div className="glass-card">
        <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📊 Dönem Özeti (Toplam)</h3>
        {Object.keys(summaries).length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Özet çıkarılacak imalat verisi bulunmuyor.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(summaries).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{key}</span>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Kaydı Sil"
        message="Bu imalat kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
};

export default ProductionManagement;
