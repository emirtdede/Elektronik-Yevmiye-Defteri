import React, { useState, useEffect } from 'react';
import SystemLogs from './SystemLogs';
import ConfirmationModal from './ui/ConfirmationModal';
import { useTranslation } from 'react-i18next';
import { GripVertical, Edit2, Check, X, Trash2 } from 'lucide-react';

const Settings = ({ activeTab = 'genel' }) => {
  const { t, i18n } = useTranslation();
  const [appSettings, setAppSettings] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [workerGroups, setWorkerGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for new items
  const [newWorkType, setNewWorkType] = useState({ name: '', multiplier: 1.0 });
  const [newGroup, setNewGroup] = useState({ name: '' });

  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });

  // Inline editing states
  const [editingWorkTypeId, setEditingWorkTypeId] = useState(null);
  const [editingWorkTypeVal, setEditingWorkTypeVal] = useState({ name: '', multiplier: 1.0 });

  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupVal, setEditingGroupVal] = useState({ name: '' });

  // Drag and drop states
  const [draggedWorkTypeIdx, setDraggedWorkTypeIdx] = useState(null);
  const [dragOverWorkTypeIdx, setDragOverWorkTypeIdx] = useState(null);
  const [draggedGroupIdx, setDraggedGroupIdx] = useState(null);
  const [dragOverGroupIdx, setDragOverGroupIdx] = useState(null);

  const fetchData = async () => {
    if (window.api) {
      setLoading(true);
      const settingsData = await window.api.db.read('app_settings');
      const typesData = await window.api.db.read('work_types');
      const groupsData = await window.api.db.read('worker_groups');
      
      setAppSettings(settingsData);
      setWorkTypes(typesData);
      setWorkerGroups(groupsData);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update App Settings
  const handleSettingChange = async (id, key, value) => {
    if (window.api) {
      setAppSettings(prev => prev.map(s => s.id === id ? { ...s, setting_value: value } : s));
      await window.api.db.update('app_settings', id, { setting_value: value });

      if (key === 'theme') {
        document.documentElement.setAttribute('data-theme', value);
      }
      if (key === 'language') {
        i18n.changeLanguage(value);
      }
    }
  };

  const handleLogoUpload = async (id, file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Img = e.target.result;
      
      const img = new Image();
      img.src = base64Img;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const resizedBase64 = canvas.toDataURL('image/png');
        await handleSettingChange(id, 'company_logo', resizedBase64);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async (id) => {
    await handleSettingChange(id, 'company_logo', '');
  };

  // Add new Work Type
  const handleAddWorkType = async (e) => {
    e.preventDefault();
    if (window.api && newWorkType.name) {
      await window.api.db.create('work_types', newWorkType);
      setNewWorkType({ name: '', multiplier: 1.0 });
      fetchData();
    }
  };

  // Delete Work Type
  const handleDeleteWorkType = async (id) => {
    setModalConfig({
      isOpen: true,
      title: t('settings.delete_work_type_title', 'Çalışma Tipini Sil'),
      message: t('settings.delete_work_type_msg', 'Bu çalışma tipini silmek istediğinize emin misiniz? Eski puantajlardaki hesaplamalar veritabanına kaydedildiği için geçmiş verileriniz bozulmayacaktır.'),
      type: 'danger',
      onConfirm: async () => {
        await window.api.db.delete('work_types', id);
        fetchData();
      }
    });
  };

  // Add new Worker Group
  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (window.api && newGroup.name) {
      await window.api.db.create('worker_groups', newGroup);
      setNewGroup({ name: '' });
      fetchData();
    }
  };

  // Delete Worker Group
  const handleDeleteGroup = async (id) => {
    setModalConfig({
      isOpen: true,
      title: t('settings.delete_group_title', 'İşçi Grubunu Sil'),
      message: t('settings.delete_group_msg', 'Bu grubu silmek istediğinize emin misiniz? Gruptaki işçilerin grup atamaları kaldırılacaktır (İşçiler silinmez).'),
      type: 'danger',
      onConfirm: async () => {
        await window.api.db.delete('worker_groups', id);
        fetchData();
      }
    });
  };

  // Reordering & Sorting helpers
  const saveCustomOrder = async (key, orderArray) => {
    if (window.api) {
      const orderString = JSON.stringify(orderArray);
      const existing = appSettings.find(s => s.setting_key === key);
      if (existing) {
        await handleSettingChange(existing.id, key, orderString);
      } else {
        const res = await window.api.db.create('app_settings', {
          setting_key: key,
          setting_value: orderString,
          description: 'Sıralama Düzeni'
        });
        if (res.success) {
          fetchData();
        }
      }
    }
  };

  const getSortedItems = (items, orderKey) => {
    const orderSetting = appSettings.find(s => s.setting_key === orderKey);
    if (!orderSetting || !orderSetting.setting_value) return items;
    try {
      const orderIds = JSON.parse(orderSetting.setting_value);
      return [...items].sort((a, b) => {
        const indexA = orderIds.indexOf(a.id);
        const indexB = orderIds.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    } catch (e) {
      return items;
    }
  };

  const handleMoveItem = async (items, index, direction, orderKey) => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    
    const newOrderIds = newItems.map(item => item.id);
    await saveCustomOrder(orderKey, newOrderIds);
  };

  // Edit Handlers for Work Types
  const startEditWorkType = (wt) => {
    setEditingWorkTypeId(wt.id);
    setEditingWorkTypeVal({ name: wt.name, multiplier: wt.multiplier });
  };

  const handleSaveWorkTypeEdit = async (id) => {
    if (window.api && editingWorkTypeVal.name) {
      await window.api.db.update('work_types', id, editingWorkTypeVal);
      setEditingWorkTypeId(null);
      fetchData();
    }
  };

  const handleCancelWorkTypeEdit = () => {
    setEditingWorkTypeId(null);
  };

  // Edit Handlers for Groups
  const startEditGroup = (grp) => {
    setEditingGroupId(grp.id);
    setEditingGroupVal({ name: grp.name });
  };

  const handleSaveGroupEdit = async (id) => {
    if (window.api && editingGroupVal.name) {
      await window.api.db.update('worker_groups', id, editingGroupVal);
      setEditingGroupId(null);
      fetchData();
    }
  };

  const handleCancelGroupEdit = () => {
    setEditingGroupId(null);
  };

  const sortedWorkTypes = getSortedItems(workTypes, 'work_types_order');
  const sortedWorkerGroups = getSortedItems(workerGroups, 'worker_groups_order');

  const handleBackup = async () => {
    if (window.api) {
      const res = await window.api.system.backupDB();
      if (res.success) {
        alert(res.message);
      } else if (res.message !== 'İşlem iptal edildi') {
        alert('Yedekleme Hatası: ' + res.message);
      }
    }
  };

  const handleVacuum = async () => {
    setModalConfig({
      isOpen: true,
      title: t('settings.vacuum_db', 'Sistemi Optimize Et'),
      message: t('settings.vacuum_desc', 'Veritabanı vakumlanarak silinmiş kayıtların kapladığı boşluklar geri kazanılacaktır. Bu işlem sistem hızınızı artırır.'),
      type: 'primary',
      onConfirm: async () => {
        if (window.api && window.api.system.vacuumDB) {
          const res = await window.api.system.vacuumDB();
          if (res.success) alert('Veritabanı başarıyla optimize edildi.');
          else alert('Optimizasyon Hatası: ' + res.message);
        }
      }
    });
  };

  const handleCloudSyncFolder = async () => {
    if (window.api && window.api.system.setCloudFolder) {
      const res = await window.api.system.setCloudFolder();
      if (res.success) {
        alert('Sessiz bulut yedekleme klasörü başarıyla ayarlandı:\n' + res.folderPath);
        fetchData();
      }
    }
  };

  if (loading) {
    return <div className="text-center"><div className="loading-spinner"></div></div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 100px)' }}>
      <header className="header" style={{ marginBottom: '0.5rem' }}>
        <h2>
          {activeTab === 'genel' ? `⚙️ ${t('nav.settings_genel', 'Genel Ayarlar')}` : 
           activeTab === 'finance' ? `💼 ${t('nav.settings_finance', 'Finans & Operasyon')}` : 
           activeTab === 'security' ? `🛡️ ${t('nav.settings_security', 'Güvenlik ve Yedekleme')}` : 
           `📋 ${t('nav.settings_logs', 'Sistem Kayıtları')}`}
        </h2>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
        
        {activeTab === 'genel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Tema ve Dil Seçimi */}
            <div className="glass-card">
              <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>{t('settings.theme_language', 'Görünüm ve Dil')}</h3>
              
              {appSettings.map(setting => {
                if (setting.setting_key === 'theme') {
                  return (
                    <div key={setting.id} className="form-group">
                      <label className="form-label">{t('settings.theme', 'Tema')}</label>
                      <select 
                        className="form-input" 
                        value={setting.setting_value}
                        onChange={(e) => handleSettingChange(setting.id, setting.setting_key, e.target.value)}
                      >
                        <option value="dark">{t('settings.theme_dark', 'Karanlık')}</option>
                        <option value="light">{t('settings.theme_light', 'Aydınlık')}</option>
                      </select>
                    </div>
                  );
                }
                if (setting.setting_key === 'language') {
                  return (
                    <div key={setting.id} className="form-group">
                      <label className="form-label">{t('settings.language', 'Dil')}</label>
                      <select 
                        className="form-input" 
                        value={setting.setting_value}
                        onChange={(e) => handleSettingChange(setting.id, setting.setting_key, e.target.value)}
                      >
                        <option value="tr">Türkçe (TR)</option>
                        <option value="en">English (EN)</option>
                        <option value="de">Deutsch (DE)</option>
                        <option value="sv">Svenska (SV)</option>
                        <option value="no">Norsk (NO)</option>
                        <option value="da">Dansk (DA)</option>
                        <option value="fr">Français (FR)</option>
                        <option value="pl">Polski (PL)</option>
                        <option value="it">Italiano (IT)</option>
                        <option value="nl">Nederlands (NL)</option>
                        <option value="cs">Čeština (CS)</option>
                        <option value="es">Español (ES)</option>
                        <option value="pt">Português (PT)</option>
                        <option value="ru">Русский (RU)</option>
                        <option value="zh">中文 (Mandarin)</option>
                        <option value="ja">日本語 (JA)</option>
                        <option value="ko">한국어 (KO)</option>
                        <option value="ar">العربية (AR)</option>
                        <option value="hi">हिन्दी (HI)</option>
                      </select>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Şirket Kimliği ve PDF Anteti */}
            <div className="glass-card">
              <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>{t('settings.company_info', 'Şirket Kimliği & PDF Anteti')}</h3>
              
              {appSettings.map(setting => {
                if (setting.setting_key === 'company_name') {
                  return (
                    <div key={setting.id} className="form-group">
                      <label className="form-label">{t('settings.company_name', 'Şirket Adı')}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={t('settings.company_name_placeholder', 'Örn: ABC İnşaat A.Ş.')}
                        value={setting.setting_value}
                        onChange={(e) => handleSettingChange(setting.id, setting.setting_key, e.target.value)}
                      />
                    </div>
                  );
                }
                if (setting.setting_key === 'company_logo') {
                  return (
                    <div key={setting.id} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label className="form-label">{t('settings.company_logo', 'Şirket Logosu')}</label>
                      {setting.setting_value && (
                        <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
                          <img 
                            src={setting.setting_value} 
                            alt="Company Logo" 
                            style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                          />
                          <button 
                            type="button"
                            className="btn btn-danger"
                            style={{ position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleRemoveLogo(setting.id)}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <label 
                          htmlFor={`logo-upload-input-${setting.id}`}
                          className="btn"
                          style={{ cursor: 'pointer', margin: 0 }}
                        >
                          📁 {t('settings.file_select_button')}
                        </label>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {setting.setting_value ? t('settings.logo_uploaded', 'Logo yüklendi') : t('settings.file_not_selected')}
                        </span>
                        <input 
                          id={`logo-upload-input-${setting.id}`}
                          type="file" 
                          accept="image/png, image/jpeg" 
                          style={{ display: 'none' }}
                          onChange={(e) => handleLogoUpload(setting.id, e.target.files[0])}
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Standart Çalışma Parametreleri */}
            <div className="glass-card">
              <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Parametreler</h3>
              {appSettings.map(setting => {
                if (['theme', 'language', 'company_name', 'company_logo'].includes(setting.setting_key) || setting.setting_key.endsWith('_order')) return null;
                return (
                  <div key={setting.id} className="form-group">
                    <label className="form-label">{t(`settings.keys.${setting.setting_key}`) || setting.description || setting.setting_key}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={setting.setting_value}
                      onChange={(e) => handleSettingChange(setting.id, setting.setting_key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Çalışma Tipleri */}
            <div className="glass-card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>{t('settings.work_types_title', 'Çalışma Tipleri & Çarpanlar')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {sortedWorkTypes.map((wt, idx) => {
                  const isEditing = editingWorkTypeId === wt.id;
                  return (
                    <div 
                      key={wt.id} 
                      draggable={!isEditing}
                      onDragStart={(e) => {
                        setDraggedWorkTypeIdx(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverWorkTypeIdx !== idx) {
                          setDragOverWorkTypeIdx(idx);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverWorkTypeIdx === idx) {
                          setDragOverWorkTypeIdx(null);
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        if (draggedWorkTypeIdx === null || draggedWorkTypeIdx === idx) {
                          setDraggedWorkTypeIdx(null);
                          setDragOverWorkTypeIdx(null);
                          return;
                        }
                        const reordered = [...sortedWorkTypes];
                        const item = reordered[draggedWorkTypeIdx];
                        reordered.splice(draggedWorkTypeIdx, 1);
                        reordered.splice(idx, 0, item);
                        const newOrderIds = reordered.map(x => x.id);
                        await saveCustomOrder('work_types_order', newOrderIds);
                        setDraggedWorkTypeIdx(null);
                        setDragOverWorkTypeIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedWorkTypeIdx(null);
                        setDragOverWorkTypeIdx(null);
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: draggedWorkTypeIdx === idx 
                          ? 'rgba(99, 102, 241, 0.08)' 
                          : 'rgba(255,255,255,0.02)',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: draggedWorkTypeIdx === idx
                          ? '1px dashed var(--primary, #6366f1)'
                          : dragOverWorkTypeIdx === idx
                            ? '1px solid var(--primary, #6366f1)'
                            : '1px solid var(--glass-border)',
                        gap: '1rem',
                        cursor: isEditing ? 'default' : 'grab',
                        opacity: draggedWorkTypeIdx === idx ? 0.5 : 1,
                        transform: draggedWorkTypeIdx !== null && dragOverWorkTypeIdx === idx && draggedWorkTypeIdx !== idx
                          ? `scale(1.01) ${draggedWorkTypeIdx < idx ? 'translateY(2px)' : 'translateY(-2px)'}`
                          : 'scale(1) translateY(0)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ flex: 2, padding: '0.4rem 0.75rem' }} 
                            value={editingWorkTypeVal.name} 
                            onChange={e => setEditingWorkTypeVal(prev => ({ ...prev, name: e.target.value }))}
                          />
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            style={{ flex: 1, padding: '0.4rem 0.75rem' }} 
                            value={editingWorkTypeVal.multiplier} 
                            onChange={e => setEditingWorkTypeVal(prev => ({ ...prev, multiplier: Number(e.target.value) }))}
                          />
                          <button onClick={() => handleSaveWorkTypeEdit(wt.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <Check size={14} />
                          </button>
                          <button onClick={handleCancelWorkTypeEdit} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <GripVertical size={16} style={{ color: 'var(--text-muted)', opacity: 0.6, cursor: 'grab', flexShrink: 0 }} />
                            <div>
                              <strong>{wt.name}</strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Çarpan: x{wt.multiplier}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => startEditWorkType(wt)} 
                              className="btn" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteWorkType(wt.id)} 
                              className="btn btn-danger" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <form onSubmit={handleAddWorkType} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                <div style={{ flex: 2 }}>
                  <label className="form-label">{t('settings.type_name_label', 'Çalışma Tipi Adı')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newWorkType.name}
                    onChange={e => setNewWorkType(prev => ({...prev, name: e.target.value}))}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">{t('settings.multiplier', 'Çarpan')}</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-input" 
                    value={newWorkType.multiplier}
                    onChange={e => setNewWorkType(prev => ({...prev, multiplier: Number(e.target.value)}))}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>{t('settings.add', 'Ekle')}</button>
              </form>
            </div>

            {/* Gruplar */}
            <div className="glass-card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>{t('settings.groups_title', 'İşçi Grupları')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {sortedWorkerGroups.map((grp, idx) => {
                  const isEditing = editingGroupId === grp.id;
                  return (
                    <div 
                      key={grp.id} 
                      draggable={!isEditing}
                      onDragStart={(e) => {
                        setDraggedGroupIdx(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverGroupIdx !== idx) {
                          setDragOverGroupIdx(idx);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverGroupIdx === idx) {
                          setDragOverGroupIdx(null);
                        }
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        if (draggedGroupIdx === null || draggedGroupIdx === idx) {
                          setDraggedGroupIdx(null);
                          setDragOverGroupIdx(null);
                          return;
                        }
                        const reordered = [...sortedWorkerGroups];
                        const item = reordered[draggedGroupIdx];
                        reordered.splice(draggedGroupIdx, 1);
                        reordered.splice(idx, 0, item);
                        const newOrderIds = reordered.map(x => x.id);
                        await saveCustomOrder('worker_groups_order', newOrderIds);
                        setDraggedGroupIdx(null);
                        setDragOverGroupIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedGroupIdx(null);
                        setDragOverGroupIdx(null);
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: draggedGroupIdx === idx 
                          ? 'rgba(99, 102, 241, 0.08)' 
                          : 'rgba(255,255,255,0.02)',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: draggedGroupIdx === idx
                          ? '1px dashed var(--primary, #6366f1)'
                          : dragOverGroupIdx === idx
                            ? '1px solid var(--primary, #6366f1)'
                            : '1px solid var(--glass-border)',
                        gap: '1rem',
                        cursor: isEditing ? 'default' : 'grab',
                        opacity: draggedGroupIdx === idx ? 0.5 : 1,
                        transform: draggedGroupIdx !== null && dragOverGroupIdx === idx && draggedGroupIdx !== idx
                          ? `scale(1.01) ${draggedGroupIdx < idx ? 'translateY(2px)' : 'translateY(-2px)'}`
                          : 'scale(1) translateY(0)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ flex: 1, padding: '0.4rem 0.75rem' }} 
                            value={editingGroupVal.name} 
                            onChange={e => setEditingGroupVal(prev => ({ ...prev, name: e.target.value }))}
                          />
                          <button onClick={() => handleSaveGroupEdit(grp.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <Check size={14} />
                          </button>
                          <button onClick={handleCancelGroupEdit} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <GripVertical size={16} style={{ color: 'var(--text-muted)', opacity: 0.6, cursor: 'grab', flexShrink: 0 }} />
                            <strong>{grp.name}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => startEditGroup(grp)} 
                              className="btn" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteGroup(grp.id)} 
                              className="btn btn-danger" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">{t('settings.group_name_label', 'Grup Adı')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newGroup.name}
                    onChange={e => setNewGroup(prev => ({...prev, name: e.target.value}))}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>{t('settings.add', 'Ekle')}</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Kritik Veri İşlemleri - Kırmızı / Uyarı Tasarımı */}
            <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.02)' }}>
              <h3 className="card-title" style={{ color: 'var(--danger)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚠️ {t('settings.critical_system_actions', 'Kritik Sistem Eylemleri')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <button className="btn btn-primary" onClick={handleBackup} style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', marginBottom: '0.5rem' }}>
                    📦 {t('settings.backup_db', 'Tüm Veritabanını Yedekle (.sqlite Export)')}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t('settings.backup_db_desc', 'Tüm sisteminizi (.sqlite veritabanı dosyası olarak) yerel diskinize aktarır. Bilgisayar değişimi veya yedekleme için kullanabilirsiniz.')}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.15)', paddingTop: '1.25rem' }}>
                  <label className="form-label" style={{ color: '#fca5a5' }}>{t('settings.restore_db_label', 'Yedekten Geri Yükle (Drag & Drop)')}</label>
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && (file.name.endsWith('.sqlite') || file.name.endsWith('.db'))) {
                        if (window.confirm(t('settings.restore_confirm', 'Veritabanını geri yüklemek istediğinize emin misiniz? Mevcut tüm verileriniz silinecektir!'))) {
                          const res = await window.api.system.restoreDBFile({ filePath: file.path });
                          if (res && !res.success) {
                            alert('Geri yükleme hatası: ' + res.message);
                          }
                        }
                      } else {
                        alert(t('settings.restore_invalid_file', 'Lütfen geçerli bir SQLite (.sqlite veya .db) veritabanı dosyası sürükleyin.'));
                      }
                    }}
                    style={{
                      border: '2px dashed rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '1.75rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(239, 68, 68, 0.04)',
                      transition: 'all 0.2s',
                    }}
                    onDragEnter={(e) => e.currentTarget.style.borderColor = 'var(--danger)'}
                    onDragLeave={(e) => e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'}
                  >
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📥</div>
                    <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>{t('settings.restore_db_title', 'Yedek Veritabanını Üzerine Yazdır')}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('settings.restore_db_desc', '.sqlite dosyasını buraya sürükleyip bırakın (Uygulama otomatik olarak yeniden başlayacaktır)')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Otomasyon ve Bakım */}
            <div className="glass-card">
              <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>{t('settings.system_maintenance', 'Sistem Bakımı')}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <button className="btn" onClick={handleVacuum} style={{ width: '100%', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.04)' }}>
                    🧹 {t('settings.vacuum_db', 'Veritabanını Optimize Et (Vacuum)')}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t('settings.vacuum_db_desc', 'Boşaltılan veya silinen kayıtların oluşturduğu veritabanı boşluklarını temizler, disk alanını geri kazanır ve sorgu hızlarını artırır.')}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                  <button className="btn" onClick={handleCloudSyncFolder} style={{ width: '100%', marginBottom: '0.5rem', border: '1px solid #10B981', color: '#10B981', background: 'transparent' }}>
                    ☁️ {t('settings.cloud_sync', 'Bulut Yedekleme Klasörü Ayarla')}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t('settings.cloud_sync_desc', 'Her uygulama kapandığında arkaplanda (sessizce) otomatik yedeklerin kaydedileceği bir Dropbox, Drive vb. bulut klasörü seçmenizi sağlar.')}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'logs' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SystemLogs />
          </div>
        )}

      </div>

      <ConfirmationModal 
        {...modalConfig} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
      />
    </div>
  );
};

export default Settings;
