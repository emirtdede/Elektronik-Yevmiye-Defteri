import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TagInput from './ui/TagInput';
import CustomDatePicker from './ui/CustomDatePicker';
import { isValidTCKN } from '../utils/validation';

const WorkerDrawer = ({ isOpen, onClose, onSave, worker }) => {
  const { t } = useTranslation();
  const [workerGroups, setWorkerGroups] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: '',
    tc_no: '',
    phone: '',
    daily_wage: '',
    group_id: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  const [tags, setTags] = useState([]);
  const [tcError, setTcError] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      if (window.api && isOpen) {
        const groups = await window.api.db.read('worker_groups');
        setWorkerGroups(groups || []);
      }
    };
    fetchGroups();
  }, [isOpen]);

  useEffect(() => {
    if (worker) {
      setFormData({
        full_name: worker.full_name || '',
        tc_no: worker.tc_no || '',
        phone: worker.phone || '',
        daily_wage: worker.daily_wage || '',
        group_id: worker.group_id || '',
        start_date: worker.start_date || new Date().toISOString().split('T')[0],
        status: worker.status || 'active'
      });
      try {
        setTags(worker.tags ? JSON.parse(worker.tags) : []);
      } catch (e) {
        setTags([]);
      }
    } else {
      setFormData({
        full_name: '',
        tc_no: '',
        phone: '',
        daily_wage: '',
        group_id: '',
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      setTags([]);
    }
    setTcError(''); // Clear error state on open/reset
  }, [worker, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tc_no') {
      setTcError(''); // Clear error on change
    }
    setFormData(prev => ({
      ...prev,
      [name]: name === 'group_id' ? (value ? Number(value) : null) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // TC Validation
    if (formData.tc_no && !isValidTCKN(formData.tc_no)) {
      setTcError('Geçersiz TC Kimlik No. Lütfen kontrol edin.');
      return;
    }

    const submitData = { ...formData, tags: JSON.stringify(tags) };
    onSave(worker?.id, submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay">
      <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
          <h2 className="drawer-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{worker ? t('worker_modal.title_edit') : t('worker_modal.title_new')}</h2>
          <button 
            type="button"
            className="btn btn-danger" 
            onClick={onClose} 
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: 'none' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.name')}</label>
            <input 
              type="text" 
              name="full_name" 
              className="form-input"
              value={formData.full_name} 
              onChange={handleChange} 
              placeholder={t('worker_modal.name_ph')}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.tc')}</label>
            <input 
              type="text" 
              name="tc_no" 
              className={`form-input ${tcError ? 'error-border' : ''}`}
              style={tcError ? { border: '1px solid #ef4444' } : {}}
              value={formData.tc_no} 
              onChange={handleChange} 
              placeholder={t('worker_modal.tc_ph')}
              maxLength={11}
            />
            {tcError && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{tcError}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.tags')}</label>
            <TagInput tags={tags} setTags={setTags} placeholder={t('worker_modal.tags_ph')} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.status')}</label>
            <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
              <option value="active">{t('worker_modal.status_active')}</option>
              <option value="passive">{t('worker_modal.status_inactive')}</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.group')}</label>
            <select 
              name="group_id" 
              className="form-input" 
              value={formData.group_id || ''} 
              onChange={handleChange}
            >
              <option value="">{t('worker_modal.group_empty')}</option>
              {workerGroups.map(grp => (
                <option key={grp.id} value={grp.id}>{grp.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.phone')}</label>
            <input 
              type="text" 
              name="phone" 
              className="form-input"
              value={formData.phone} 
              onChange={handleChange} 
              placeholder={t('worker_modal.phone_ph')}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.wage')}</label>
            <input 
              type="number" 
              name="daily_wage" 
              className="form-input"
              value={formData.daily_wage} 
              onChange={handleChange} 
              placeholder={t('worker_modal.wage_ph')}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('worker_modal.start_date')}</label>
            <CustomDatePicker 
              name="start_date" 
              className="form-input" 
              value={formData.start_date} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ flex: 1, fontWeight: 'bold' }}>{t('worker_modal.cancel')}</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 'bold' }}>{t('worker_modal.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerDrawer;
