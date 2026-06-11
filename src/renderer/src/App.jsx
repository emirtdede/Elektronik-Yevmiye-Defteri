import React, { useState, useEffect } from 'react';
import WorkerDrawer from './components/WorkerDrawer';
import WorkerProfile from './components/WorkerProfile';
import Settings from './components/Settings';
import CashRegister from './components/CashRegister';
import AnomalyPanel from './components/AnomalyPanel';
import GroupReportPanel from './components/GroupReportPanel';
import ConfirmationModal from './components/ui/ConfirmationModal';
import Spotlight from './components/ui/Spotlight';

// New ERP Modules
import ProjectManagement from './components/ProjectManagement';
import ProductionManagement from './components/ProductionManagement';
import MaterialManagement from './components/MaterialManagement';
import DailyJournal from './components/DailyJournal';
import QualityReports from './components/QualityReports';
import SubcontractorLedger from './components/SubcontractorLedger';
import MediaGallery from './components/MediaGallery';
import AboutHelp from './components/AboutHelp';

import { exportToExcel, exportToCSV, exportToJSON, generateExcelTemplate } from './utils/exportUtils';
import { readWorkersFromExcel } from './utils/importUtils';
import { useTranslation } from 'react-i18next';
import './index.css';

function App() {
  const { t, i18n } = useTranslation();
  
  const langToLocaleMap = {
    en: 'en-US',
    tr: 'tr-TR',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    zh: 'zh-CN',
    ru: 'ru-RU',
    ja: 'ja-JP',
    ko: 'ko-KR',
    it: 'it-IT',
    nl: 'nl-NL',
    pt: 'pt-PT',
    ar: 'ar-SA',
    hi: 'hi-IN',
    sv: 'sv-SE',
    no: 'nb-NO',
    da: 'da-DK',
    pl: 'pl-PL',
    cs: 'cs-CZ'
  };

  useEffect(() => {
    document.documentElement.lang = langToLocaleMap[i18n.language] || i18n.language;
  }, [i18n.language]);

  const [view, setView] = useState('list'); // 'list' | 'profile' | 'settings' | 'kasa' | 'projects' | 'production' | 'materials' | 'journal' | 'quality' | 'subcontractor' | 'media'
  const [selectedWorkerProfile, setSelectedWorkerProfile] = useState(null);

  const [workers, setWorkers] = useState([]);
  const [balances, setBalances] = useState({});
  const [workerGroups, setWorkerGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        const projectsData = await window.api.db.read('projects');
        
        setWorkers(data);
        setWorkerGroups(groupsData || []);
        setProjects(projectsData || []);
        
        // Auto select first project if none active
        if (projectsData && projectsData.length > 0 && !activeProjectId) {
          setActiveProjectId(projectsData[0].id);
        }
        
        // Apply global settings (theme & language)
        if (settingsData) {
          const sMap = {};
          settingsData.forEach(s => sMap[s.setting_key] = s.setting_value);
          if (sMap['theme']) {
            document.documentElement.setAttribute('data-theme', sMap['theme']);
          } else {
            const defaultTheme = 'dark';
            document.documentElement.setAttribute('data-theme', defaultTheme);
            await window.api.db.create('app_settings', { setting_key: 'theme', setting_value: defaultTheme, description: 'Uygulama Teması (dark/light)' });
          }

          if (sMap['language']) {
            i18n.changeLanguage(sMap['language']);
            document.documentElement.lang = sMap['language'];
          } else {
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
    fetchWorkers();
  }, [view, activeProjectId]);

  useEffect(() => {
    if (view.startsWith('settings_')) {
      setIsSettingsOpen(true);
    }
  }, [view]);

  // Global Ctrl+K listener to toggle spotlight
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

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
      // Bind worker to the active project
      const dataToSave = { ...workerData, project_id: activeProjectId };
      if (id) {
        await window.api.db.update('workers', id, dataToSave);
      } else {
        await window.api.db.create('workers', dataToSave);
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

  // Filter workers by search query AND active project
  const filteredWorkers = workers.filter(w => {
    const matchProject = activeProjectId ? w.project_id == activeProjectId : true;
    const matchText = w.full_name.toLowerCase().includes(filterText.toLowerCase()) || 
                      (w.tc_no && w.tc_no.includes(filterText)) ||
                      (w.phone && w.phone.includes(filterText));
    const matchGroup = filterGroup ? w.group_id == filterGroup : true;
    return matchProject && matchText && matchGroup;
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
        if (window.api && window.api.system.createSnapshot) {
          await window.api.system.createSnapshot();
        }
        for (const worker of result.data) {
          // Bind imported workers to active project
          await window.api.db.create('workers', { ...worker, project_id: activeProjectId });
        }
        fetchWorkers();
        setUndoAvailable(true);
        e.target.value = null; // reset
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

  const activeProjectObj = projects.find(p => p.id === activeProjectId);

  return (
    <>
      <div className="app-layout">
        {/* Left fixed Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            🏗️ ŞantiyemOS
          </div>
          
          {/* Active project badge */}
          {activeProjectObj ? (
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              margin: '0 1rem 1.5rem 1rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{t('nav.active_project', 'Aktif Şantiye')}</div>
              <strong style={{ color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{activeProjectObj.name}</strong>
            </div>
          ) : (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '0 1rem 1.5rem 1rem', fontWeight: 'bold' }}>⚠️ {t('nav.no_project_selected', 'Şantiye Seçilmedi!')}</div>
          )}

          <nav className="sidebar-nav">
            <div className={`sidebar-link ${view === 'list' || view === 'profile' ? 'active' : ''}`} onClick={() => { setView('list'); setSelectedWorkerProfile(null); }}>
              👥 {t('nav.personnel')}
            </div>
            <div className={`sidebar-link ${view === 'projects' ? 'active' : ''}`} onClick={() => setView('projects')}>
              🏗️ {t('nav.projects', 'Şantiyeler (Lokasyon)')}
            </div>
            <div className={`sidebar-link ${view === 'production' ? 'active' : ''}`} onClick={() => setView('production')}>
              📐 {t('nav.production', 'İmalat ve Metraj')}
            </div>
            <div className={`sidebar-link ${view === 'materials' ? 'active' : ''}`} onClick={() => setView('materials')}>
              📄 {t('nav.materials', 'İrsaliye & Malzeme')}
            </div>
            <div className={`sidebar-link ${view === 'journal' ? 'active' : ''}`} onClick={() => setView('journal')}>
              📓 {t('nav.journal', 'Günlük Jurnal')}
            </div>
            <div className={`sidebar-link ${view === 'quality' ? 'active' : ''}`} onClick={() => setView('quality')}>
              🛡️ {t('nav.quality', 'Kalite Kontrol')}
            </div>
            <div className={`sidebar-link ${view === 'subcontractor' ? 'active' : ''}`} onClick={() => setView('subcontractor')}>
              🚜 {t('nav.subcontractors', 'Taşeron Carileri')}
            </div>
            <div className={`sidebar-link ${view === 'media' ? 'active' : ''}`} onClick={() => setView('media')}>
              📷 {t('nav.media', 'Medya Galerisi')}
            </div>
            <div className={`sidebar-link ${view === 'kasa' ? 'active' : ''}`} onClick={() => setView('kasa')}>
              💵 {t('nav.cash')}
            </div>
            <div className={`sidebar-link ${view === 'hakkinda' ? 'active' : ''}`} onClick={() => setView('hakkinda')}>
              ❓ {t('nav.help', 'Hakkında & Yardım')}
            </div>
            <div>
              <div 
                className={`sidebar-link ${view.startsWith('settings_') ? 'active' : ''}`} 
                onClick={() => setIsSettingsOpen(prev => !prev)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>⚙️ {t('nav.settings')}</span>
                <span style={{ 
                  transform: isSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease', 
                  fontSize: '0.7rem', 
                  opacity: 0.7,
                  display: 'inline-block' 
                }}>▼</span>
              </div>
              
              <div style={{
                maxHeight: isSettingsOpen ? '200px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                paddingLeft: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                marginTop: isSettingsOpen ? '0.25rem' : '0'
              }}>
                <div 
                  className={`sidebar-link ${view === 'settings_genel' ? 'active' : ''}`} 
                  onClick={() => setView('settings_genel')}
                  style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  ⚙️ {t('nav.settings_genel', 'Genel Ayarlar')}
                </div>
                <div 
                  className={`sidebar-link ${view === 'settings_finance' ? 'active' : ''}`} 
                  onClick={() => setView('settings_finance')}
                  style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  💼 {t('nav.settings_finance', 'Finans & Operasyon')}
                </div>
                <div 
                  className={`sidebar-link ${view === 'settings_security' ? 'active' : ''}`} 
                  onClick={() => setView('settings_security')}
                  style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  🛡️ {t('nav.settings_security', 'Güvenlik & Yedek')}
                </div>
                <div 
                  className={`sidebar-link ${view === 'settings_logs' ? 'active' : ''}`} 
                  onClick={() => setView('settings_logs')}
                  style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  📋 {t('nav.settings_logs', 'Sistem Kayıtları')}
                </div>
              </div>
            </div>
          </nav>

          <div className="sidebar-footer" style={{ textAlign: 'center' }}>
            <div>Spotlight: <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: '3px' }}>Ctrl + K</kbd></div>
          </div>
        </aside>

        {/* Right Dynamic Page View */}
        <main className="main-content">
          {view === 'profile' && selectedWorkerProfile ? (
            <WorkerProfile worker={selectedWorkerProfile} onBack={closeProfile} />
          ) : view.startsWith('settings_') ? (
            <Settings activeTab={view.split('_')[1]} />
          ) : view === 'settings' ? (
            <Settings activeTab="genel" />
          ) : view === 'hakkinda' ? (
            <AboutHelp />
          ) : view === 'kasa' ? (
            <CashRegister />
          ) : view === 'projects' ? (
            <ProjectManagement onSelectProject={(id) => setActiveProjectId(id)} activeProjectId={activeProjectId} />
          ) : view === 'production' ? (
            <ProductionManagement activeProjectId={activeProjectId} projects={projects} />
          ) : view === 'materials' ? (
            <MaterialManagement activeProjectId={activeProjectId} projects={projects} />
          ) : view === 'journal' ? (
            <DailyJournal activeProjectId={activeProjectId} projects={projects} />
          ) : view === 'quality' ? (
            <QualityReports activeProjectId={activeProjectId} projects={projects} />
          ) : view === 'subcontractor' ? (
            <SubcontractorLedger activeProjectId={activeProjectId} projects={projects} />
          ) : view === 'media' ? (
            <MediaGallery activeProjectId={activeProjectId} projects={projects} />
          ) : (
            // Bento Grid Dashboard Layout
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <header className="header" style={{ marginBottom: '1.5rem' }}>
                <h1>{t('dashboard.title')}</h1>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    style={{ display: 'none' }} 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  {activeProjectId && (
                    <>
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
                    </>
                  )}
                </div>
              </header>

              {!activeProjectId ? (
                <div className="glass-card text-center" style={{ padding: '4rem 2rem' }}>
                  <h2>🏗️ {t('common.welcome_title', 'ŞantiyemOS Hoş Geldiniz')}</h2>
                  <p className="card-subtitle mt-4">{t('common.welcome_msg', 'Kayıt girişi yapabilmek veya personel yönetebilmek için lütfen sol menüden yeni bir Şantiye oluşturun veya aktif bir çalışma alanı seçin.')}</p>
                </div>
              ) : (
                <div className="bento-grid">
                  {/* Left Column: Personnel List (span 8) */}
                  <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
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

                    {loading ? (
                      <div className="skeleton" style={{ height: '300px', width: '100%' }}></div>
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
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Widgets / Anomaly & Reports (span 4) */}
                  <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <GroupReportPanel />
                    <AnomalyPanel workers={workers} balances={balances} />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Spotlight command center overlay */}
      <Spotlight 
        isOpen={isSpotlightOpen} 
        onClose={() => setIsSpotlightOpen(false)} 
        onNavigate={(v, raw) => {
          setView(v);
          if (v === 'profile' && raw) {
            setSelectedWorkerProfile(raw);
          }
        }} 
        workers={workers}
        projects={projects}
      />

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
    </>
  );
}

export default App;
