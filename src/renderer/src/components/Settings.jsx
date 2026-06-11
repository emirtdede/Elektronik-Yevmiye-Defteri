import React, { useState, useEffect } from 'react';
import SystemLogs from './SystemLogs';
import ConfirmationModal from './ui/ConfirmationModal';
import AboutHelp from './AboutHelp';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('genel'); // 'genel' | 'logs'
  const [appSettings, setAppSettings] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [workerGroups, setWorkerGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for new items
  const [newWorkType, setNewWorkType] = useState({ name: '', multiplier: 1.0 });
  const [newGroup, setNewGroup] = useState({ name: '' });

  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });

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
      // Optistic UI update
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
      
      // Optionally resize using canvas to save DB space
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
      title: 'Çalışma Tipini Sil',
      message: 'Bu çalışma tipini silmek istediğinize emin misiniz? Eski puantajlardaki hesaplamalar (çarpanlar) veritabanına mühürlendiği için geçmiş verileriniz bozulmayacaktır.',
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
      title: 'İşçi Grubunu Sil',
      message: 'Bu grubu silmek istediğinize emin misiniz? Gruptaki işçilerin grup atamaları kaldırılacaktır (İşçiler silinmez).',
      type: 'danger',
      onConfirm: async () => {
        await window.api.db.delete('worker_groups', id);
        fetchData();
      }
    });
  };

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
      title: 'Sistemi Optimize Et',
      message: 'Veritabanı vakumlanarak silinmiş kayıtların kapladığı boşluklar geri kazanılacaktır. Bu işlem sistem hızınızı artırır ancak büyük veritabanlarında birkaç saniye sürebilir.',
      type: 'primary',
      onConfirm: async () => {
        if (window.api && window.api.system.vacuumDB) {
          const res = await window.api.system.vacuumDB();
          if (res.success) alert('Veritabanı başarıyla optimize edildi.');
          else alert('Optimizasyon Hatası: ' + res.message);
        } else {
          alert('Vakum komutu henüz backend tarafında desteklenmiyor.');
        }
      }
    });
  };

  const handleCloudSyncFolder = async () => {
    if (window.api && window.api.system.setCloudFolder) {
      const res = await window.api.system.setCloudFolder();
      if (res.success) {
        alert('Sessiz bulut yedekleme klasörü başarıyla ayarlandı:\n' + res.folderPath);
        // İsteğe bağlı: UI'da bu klasörü göstermek için appSettings yenilenebilir.
        fetchData();
      }
    } else {
      alert('Sessiz yedekleme özelliği henüz backend tarafında desteklenmiyor.');
    }
  };

  if (loading) {
    return <div className="text-center"><div className="loading-spinner"></div></div>;
  }

  return (
    <div style={{ maxWidth: activeTab === 'logs' ? '1200px' : '1000px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="header" style={{ marginBottom: '1rem' }}>
        <h2>{t('settings.title')}</h2>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <h3 
          className="card-title" 
          style={{ cursor: 'pointer', color: activeTab === 'genel' ? 'var(--text-main)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('genel')}
        >
          {t('settings.tab_general')}
        </h3>
        <h3 
          className="card-title" 
          style={{ cursor: 'pointer', color: activeTab === 'logs' ? 'var(--text-main)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('logs')}
        >
          {t('settings.tab_logs')}
        </h3>
        <h3 
          className="card-title" 
          style={{ cursor: 'pointer', color: activeTab === 'hakkinda' ? 'var(--text-main)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('hakkinda')}
        >
          {t('about.title', 'Hakkında & Yardım')}
        </h3>
      </div>

      {activeTab === 'hakkinda' ? (
        <AboutHelp />
      ) : activeTab === 'genel' ? (
        <div className="profile-grid" style={{ flex: 1 }}>
          {/* Left Column: App Settings */}
          <div className="left-panel">
          <div className="glass-card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.general')}</h3>
            
            {appSettings.map(setting => {
              // Hide specialized settings from general list
              if (['theme', 'language', 'company_name', 'company_logo'].includes(setting.setting_key)) return null;

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
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              {t('settings.auto_save_note')}
            </div>
          </div>

          <div className="glass-card" style={{ marginTop: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.company_info')}</h3>
            
            {appSettings.map(setting => {
              if (setting.setting_key === 'company_name') {
                return (
                  <div key={setting.id} className="form-group">
                    <label className="form-label">{t('settings.company_name')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Örn: ABC İnşaat A.Ş."
                      value={setting.setting_value}
                      onChange={(e) => handleSettingChange(setting.id, setting.setting_key, e.target.value)}
                    />
                  </div>
                );
              }
              if (setting.setting_key === 'company_logo') {
                return (
                  <div key={setting.id} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="form-label">{t('settings.company_logo')}</label>
                    {setting.setting_value && (
                      <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
                        <img 
                          src={setting.setting_value} 
                          alt="Company Logo" 
                          style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'contain', background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '4px' }} 
                        />
                        <button 
                          type="button"
                          className="btn"
                          style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', padding: '0.2rem 0.5rem', fontSize: '0.8rem', borderRadius: '50%', border: 'none', cursor: 'pointer', lineHeight: '1' }}
                          onClick={() => handleRemoveLogo(setting.id)}
                          title="Logoyu Kaldır"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="form-input" 
                      style={{ padding: '0.4rem' }}
                      onChange={(e) => handleLogoUpload(setting.id, e.target.files[0])}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>* PNG veya JPG formatında. Otomatik olarak optimize edilir.</small>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="glass-card" style={{ marginTop: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.theme_language')}</h3>
            
            {appSettings.map(setting => {
              if (setting.setting_key === 'theme') {
                return (
                  <div key={setting.id} className="form-group">
                    <label className="form-label">{t('settings.theme')}</label>
                    <select 
                      className="form-input" 
                      value={setting.setting_value}
                      onChange={(e) => handleSettingChange(setting.id, setting.setting_key, e.target.value)}
                    >
                      <option value="dark">{t('settings.theme_dark')}</option>
                      <option value="light">{t('settings.theme_light')}</option>
                    </select>
                  </div>
                );
              }
              if (setting.setting_key === 'language') {
                return (
                  <div key={setting.id} className="form-group">
                    <label className="form-label">{t('settings.language')}</label>
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

          <div className="glass-card" style={{ marginTop: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.5rem', color: '#38bdf8' }}>{t('settings.security_title')}</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <button className="btn btn-primary" onClick={handleBackup} style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', marginBottom: '0.5rem' }}>
                {t('settings.backup_db')}
              </button>
              <p className="text-sm text-gray-500" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('settings.backup_desc')}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <button className="btn" onClick={handleVacuum} style={{ width: '100%', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.05)' }}>
                {t('settings.vacuum_db')}
              </button>
              <p className="text-sm text-gray-500" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('settings.vacuum_desc')}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <button className="btn" onClick={handleCloudSyncFolder} style={{ width: '100%', marginBottom: '0.5rem', border: '1px solid #10B981', color: '#10B981' }}>
                {t('settings.cloud_sync')}
              </button>
              <p className="text-sm text-gray-500" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('settings.cloud_sync_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Work Types */}
        <div className="right-panel">
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.work_types_title')}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {workTypes.map(wt => (
                <div key={wt.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{wt.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{t('settings.multiplier')}: x{wt.multiplier}</div>
                  </div>
                  <button 
                    onClick={() => handleDeleteWorkType(wt.id)}
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    {t('settings.delete')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.add_new_type')}</h3>
            <form onSubmit={handleAddWorkType} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                <label className="form-label">{t('settings.type_name')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newWorkType.name}
                  onChange={e => setNewWorkType(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label">{t('settings.multiplier')}</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-input" 
                  value={newWorkType.multiplier}
                  onChange={e => setNewWorkType(prev => ({...prev, multiplier: Number(e.target.value)}))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>{t('settings.add')}</button>
            </form>
          </div>

          {/* Groups Management */}
          <div className="glass-card" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.groups_title')}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {workerGroups.map(grp => (
                <div key={grp.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{grp.name}</div>
                  <button 
                    onClick={() => handleDeleteGroup(grp.id)}
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    {t('settings.delete')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.add_new_group')}</h3>
            <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                <label className="form-label">{t('settings.group_name')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newGroup.name}
                  onChange={e => setNewGroup(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>{t('settings.add')}</button>
            </form>
          </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <SystemLogs />
        </div>
      )}
      
      <ConfirmationModal 
        {...modalConfig} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
      />
    </div>
  );
};

export default Settings;
