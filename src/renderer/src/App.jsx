import React, { useState, useEffect } from 'react';
import WorkerDrawer from './components/WorkerDrawer';
import WorkerProfile from './components/WorkerProfile';
import Settings from './components/Settings';
import CashRegister from './components/CashRegister';
import AnomalyPanel from './components/AnomalyPanel';
import GroupReportPanel from './components/GroupReportPanel';
import ConfirmationModal from './components/ui/ConfirmationModal';
import { exportToExcel, exportToCSV, exportToJSON, generateExcelTemplate } from './utils/exportUtils';
import { readWorkersFromExcel } from './utils/importUtils';
import { useTranslation } from 'react-i18next';
import './index.css';

function App() {
  const { t, i18n } = useTranslation();
  
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const [view, setView] = useState('list'); // 'list' | 'profile' | 'settings' | 'kasa'
  const [selectedWorkerProfile, setSelectedWorkerProfile] = useState(null);

  const [workers, setWorkers] = useState([]);
  const [balances, setBalances] = useState({});
  const [workerGroups, setWorkerGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  // Filtre State
  const [filterText, setFilterText] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  // Confirmation Modal State
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Excel Import Undo State
  const [undoAvailable, setUndoAvailable] = useState(false);
  const fileInputRef = React.useRef(null);

  const fetchWorkers = async () => {
    try {
      if (window.api && window.api.db) {
        const data = await window.api.db.read('workers');
        const groupsData = await window.api.db.read('worker_groups');
        const settingsData = await window.api.db.read('app_settings');
        
        setWorkers(data);
        setWorkerGroups(groupsData || []);

        // Apply global settings (theme & language)
        if (settingsData) {
          const sMap = {};
          settingsData.forEach(s => sMap[s.setting_key] = s.setting_value);
          if (sMap['theme']) {
            document.documentElement.setAttribute('data-theme', sMap['theme']);
          } else {
            // First time setup: default theme
            const defaultTheme = 'dark';
            document.documentElement.setAttribute('data-theme', defaultTheme);
            await window.api.db.create('app_settings', { setting_key: 'theme', setting_value: defaultTheme, description: 'Uygulama Teması (dark/light)' });
          }

          if (sMap['language']) {
            i18n.changeLanguage(sMap['language']);
            document.documentElement.lang = sMap['language'];
          } else {
            // First time setup: detect OS language
            const supportedLangs = ['tr', 'en', 'zh', 'es', 'fr', 'ar', 'hi', 'ru', 'pt', 'de', 'sv', 'no', 'da', 'pl', 'it', 'nl', 'cs', 'ja', 'ko'];
            const navLang = navigator.language.split('-')[0].toLowerCase();
            const systemLang = supportedLangs.includes(navLang) ? navLang : 'tr';
            i18n.changeLanguage(systemLang);
            document.documentElement.lang = systemLang;
            await window.api.db.create('app_settings', { setting_key: 'language', setting_value: systemLang, description: 'Uygulama Dili' });
          }
        }

        // Fetch balances for each worker
        const newBalances = {};
        for (const w of data) {
          const res = await window.api.finance.getBalance(w.id);
          if (res.success) newBalances[w.id] = res.balance;
        }
        setBalances(newBalances);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch once to get settings even if not in list view initially
    fetchWorkers();
  }, [view]);

  const handleOpenDrawer = (worker = null) => {
    setEditingWorker(worker);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingWorker(null);
  };

  const handleSaveWorker = async (id, workerData) => {
    if (window.api && window.api.db) {
      if (id) {
        await window.api.db.update('workers', id, workerData);
      } else {
        await window.api.db.create('workers', workerData);
      }
      fetchWorkers();
      handleCloseDrawer();
    }
  };

  const handleDeleteWorker = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Personeli Sil',
      message: 'Bu personeli silmek (çöp kutusuna taşımak) istediğinize emin misiniz? Sistemdeki verileri kalıcı olarak silinmez, ancak listelerden kaldırılır.',
      onConfirm: async () => {
        if (window.api && window.api.db) {
          await window.api.db.delete('workers', id);
          fetchWorkers();
        }
      }
    });
  };

  const openProfile = (worker) => {
    setSelectedWorkerProfile(worker);
    setView('profile');
  };

  const closeProfile = () => {
    setSelectedWorkerProfile(null);
    setView('list');
  };

  const filteredWorkers = workers.filter(w => {
    const matchText = w.full_name.toLowerCase().includes(filterText.toLowerCase()) || 
                      (w.tc_no && w.tc_no.includes(filterText)) ||
                      (w.phone && w.phone.includes(filterText));
    const matchGroup = filterGroup ? w.group_id == filterGroup : true;
    return matchText && matchGroup;
  });

  const handleExport = (format) => {
    const dataToExport = filteredWorkers.map(w => ({
      'Ad Soyad': w.full_name,
      'TC Kimlik No': w.tc_no || '-',
      'Telefon': w.phone || '-',
      'Günlük Yevmiye (TL)': w.daily_wage,
      'Bağlı Olduğu Grup': workerGroups.find(g => g.id === w.group_id)?.name || '-',
      'Net Bakiye (TL)': balances[w.id] || 0,
      'İşe Başlama': w.start_date
    }));

    if (format === 'excel') exportToExcel(dataToExport, 'Personel_Listesi');
    if (format === 'csv') exportToCSV(dataToExport, 'Personel_Listesi');
    if (format === 'json') exportToJSON(dataToExport, 'Personel_Listesi');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await readWorkersFromExcel(file, t);
      if (result.success) {
        // 1. Snapshot al (Time Machine)
        if (window.api && window.api.system.createSnapshot) {
          await window.api.system.createSnapshot();
        }

        // 2. Verileri DB'ye yaz
        for (const worker of result.data) {
          await window.api.db.create('workers', worker);
        }

        // 3. UI'ı güncelle ve Geri Al bildirimini göster
        fetchWorkers();
        setUndoAvailable(true);
        e.target.value = null; // reset input
        
        // Geri al bildirimini 15 saniye sonra gizle
        setTimeout(() => setUndoAvailable(false), 15000);
      }
    } catch (err) {
      alert(err.message);
      e.target.value = null;
    }
  };

  const handleUndoImport = async () => {
    if (window.api && window.api.system.restoreSnapshot) {
      const res = await window.api.system.restoreSnapshot();
      if (res.success) {
        alert('İşlem başarıyla geri alındı!');
        setUndoAvailable(false);
        fetchWorkers();
      } else {
        alert('Geri alma başarısız oldu: ' + res.message);
      }
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div 
          className={`nav-link ${view === 'list' || view === 'profile' ? 'active' : ''}`}
          onClick={() => { setView('list'); setSelectedWorkerProfile(null); }}
        >
          {t('nav.personnel')}
        </div>
        <div 
          className={`nav-link ${view === 'kasa' ? 'active' : ''}`}
          onClick={() => { setView('kasa'); setSelectedWorkerProfile(null); }}
        >
          {t('nav.cash')}
        </div>
        <div 
          className={`nav-link ${view === 'settings' ? 'active' : ''}`}
          onClick={() => { setView('settings'); setSelectedWorkerProfile(null); }}
        >
          {t('nav.settings')}
        </div>
      </nav>

      <div className="app-container">
        {view === 'profile' && selectedWorkerProfile ? (
          <WorkerProfile worker={selectedWorkerProfile} onBack={closeProfile} />
        ) : view === 'settings' ? (
          <Settings />
        ) : view === 'kasa' ? (
          <CashRegister />
        ) : (
          <>
            <header className="header" style={{ marginBottom: '1rem' }}>
              <h1>{t('dashboard.title')}</h1>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button className="btn" style={{ background: '#10B981', color: 'white', border: 'none' }} onClick={() => fileInputRef.current.click()}>
                  {t('dashboard.import_excel')}
                </button>
                <button className="btn" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid #38bdf8' }} onClick={() => generateExcelTemplate(t)}>
                  {t('about.download_template')}
                </button>
                <select className="btn" style={{ padding: '0.5rem' }} onChange={e => handleExport(e.target.value)} value="">
                  <option value="" disabled>{t('dashboard.export')}</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
                <button className="btn btn-primary" onClick={() => handleOpenDrawer()}>
                  {t('dashboard.new_worker')}
                </button>
              </div>
            </header>

            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t('dashboard.search')} 
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                style={{ flex: 2 }}
              />
              <select 
                className="form-input" 
                value={filterGroup} 
                onChange={e => setFilterGroup(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">{t('dashboard.all_groups')}</option>
                {workerGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <GroupReportPanel />
            <AnomalyPanel workers={workers} balances={balances} />

            {loading ? (
              <div className="text-center">
                <div className="loading-spinner"></div>
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
                <h2 className="card-title">{t('dashboard.empty_state')}</h2>
                <p className="card-subtitle mt-4">{t('dashboard.empty_state_sub')}</p>
              </div>
            ) : (
              <div className="workers-grid">
                {filteredWorkers.map((worker) => {
                  const bal = balances[worker.id] || 0;
                  const isPositive = bal >= 0;
                  const group = workerGroups.find(g => g.id === worker.group_id);
                  return (
                  <div key={worker.id} className="glass-card" onClick={() => openProfile(worker)} style={{ cursor: 'pointer', position: 'relative' }}>
                    {group && (
                      <span style={{
                        position: 'absolute', top: '-10px', left: '10px',
                        background: '#3b82f6', color: '#fff', padding: '2px 8px',
                        borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold'
                      }}>
                        {group.name}
                      </span>
                    )}
                    <div className="card-header">
                      <div>
                        <h3 className="card-title">{worker.full_name}</h3>
                        <p className="card-subtitle">{worker.phone || t('dashboard.phone_not_found')}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: isPositive ? '#34d399' : '#ef4444', fontSize: '1.2rem' }}>
                          {bal} ₺
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('dashboard.net_balance')}</div>
                      </div>
                    </div>
                    
                    <div className="card-actions" onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn" 
                        onClick={() => handleOpenDrawer(worker)}
                        style={{ flex: 1 }}
                      >
                        {t('dashboard.edit')}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDeleteWorker(worker.id)}
                        style={{ flex: 1 }}
                      >
                        {t('dashboard.delete')}
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </>
        )}

        <WorkerDrawer 
          isOpen={isDrawerOpen} 
          onClose={handleCloseDrawer}
          onSave={handleSaveWorker}
          worker={editingWorker}
        />

        <ConfirmationModal 
          isOpen={confirmModalState.isOpen}
          onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModalState.onConfirm}
          title={confirmModalState.title}
          message={confirmModalState.message}
        />

        {undoAvailable && (
          <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            background: '#1e293b', color: 'white', padding: '1rem 1.5rem',
            borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '1rem',
            border: '1px solid #3b82f6', zIndex: 9999,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div>
              <strong>Toplu aktarım tamamlandı!</strong>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Bir hata yaptıysanız işlemi hemen geri alabilirsiniz.</div>
            </div>
            <button onClick={handleUndoImport} style={{
              background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem',
              borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}>
              Geri Al (Undo)
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
