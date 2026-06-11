import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const Spotlight = ({ isOpen, onClose, onNavigate, workers = [], projects = [] }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Global keydown listeners for opening (Ctrl+K / Cmd+K) and navigating
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // Open trigger
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle keys when open
  const handleKeys = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[activeIndex]) {
        selectItem(filteredItems[activeIndex]);
      }
    }
  };

  const navItems = [
    { type: 'nav', id: 'list', label: t('nav.personnel', 'Personel Yönetimi'), desc: 'Personel listesi ve cari bakiye özetleri' },
    { type: 'nav', id: 'projects', label: 'Şantiye Yönetimi', desc: 'Şantiyeler, lokasyonlar ve proje durumları' },
    { type: 'nav', id: 'production', label: 'İmalat ve Metraj', desc: 'Metraj kayıtları ve imalat ilerleme takibi' },
    { type: 'nav', id: 'materials', label: 'İrsaliye ve Malzeme', desc: 'Gelen malzemeler ve beton irsaliyeleri' },
    { type: 'nav', id: 'journal', label: 'Günlük Jurnal', desc: 'Şantiye günlükleri ve otomatik hava durumu' },
    { type: 'nav', id: 'quality', label: 'Kalite Kontrol', desc: 'Tutanaklar, imalat hataları ve kalite raporları' },
    { type: 'nav', id: 'subcontractor', label: 'Taşeron Cari Takibi', desc: 'Hafriyatçı, yemekçi vb. dış yüklenici carileri' },
    { type: 'nav', id: 'media', label: 'Medya Galerisi', desc: 'Fotoğraflı irsaliye ve tutanak galerisi' },
    { type: 'nav', id: 'kasa', label: t('nav.cash', 'Kasa Yönetimi'), desc: 'Nakit giriş/çıkış hareketleri ve özet kasa' },
    { type: 'nav', id: 'settings', label: t('nav.settings', 'Ayarlar'), desc: 'Tema, dil, bulut yedekleme ve genel ayarlar' }
  ];

  const faqItems = [
    { type: 'faq', id: 'faq_1', label: 'Kasa bakiyesi nasıl hesaplanır?', desc: 'Nakit Giriş - Nakit Çıkış. Avanslar otomatik kasa çıkışı yazılır.' },
    { type: 'faq', id: 'faq_2', label: 'Sistem yedeği (Geri Yükleme) nasıl yapılır?', desc: 'Settings sayfasında .sqlite yedeğini sürükleyip bırakarak yapılır.' }
  ];

  // Compile search database
  const searchItems = [
    ...navItems,
    ...workers.map(w => ({ type: 'worker', id: w.id, label: w.full_name, desc: `${w.phone || ''} | Bakiye: ${w.daily_wage} ₺/gün`, raw: w })),
    ...projects.map(p => ({ type: 'project', id: p.id, label: p.name, desc: p.location || 'Lokasyon girilmemiş', raw: p })),
    ...faqItems
  ];

  // Filter items based on query
  const filteredItems = searchItems.filter(item => {
    if (!query) return item.type === 'nav'; // default show navigation links
    const term = query.toLowerCase();
    return item.label.toLowerCase().includes(term) || item.desc.toLowerCase().includes(term);
  }).slice(0, 8); // limit to 8 results for premium look

  const selectItem = (item) => {
    if (item.type === 'nav') {
      onNavigate(item.id);
    } else if (item.type === 'worker') {
      onNavigate('profile', item.raw);
    } else if (item.type === 'project') {
      onNavigate('projects');
    } else if (item.type === 'faq') {
      onNavigate('hakkinda'); // go to FAQ tab
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div className="spotlight-modal" onClick={e => e.stopPropagation()}>
        <div className="spotlight-search-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            ref={inputRef}
            type="text" 
            className="spotlight-input" 
            placeholder="Şantiye komuta merkezinde ara..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeys}
          />
          <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESC</kbd>
        </div>
        <div className="spotlight-results">
          {filteredItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Sonuç bulunamadı. Başka bir kelime aramayı deneyin.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div 
                key={`${item.type}-${item.id}`}
                className={`spotlight-item ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => selectItem(item)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600', color: '#fff' }}>{item.label}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.desc}</span>
                </div>
                <span className="spotlight-item-badge">
                  {item.type === 'nav' ? 'MENÜ' : item.type === 'worker' ? 'PERSONEL' : item.type === 'project' ? 'ŞANTİYE' : 'SSS'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Spotlight;
