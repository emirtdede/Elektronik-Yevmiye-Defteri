import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatUtils';

const AnomalyPanel = ({ workers, balances }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'balance' | 'expired' | 'approaching'
  const [searchName, setSearchName] = useState('');

  // 1. Eksi bakiyeli işçiler (Çok fazla avans almışlar)
  const allNegativeBalanceWorkers = workers.filter(w => {
    const bal = balances[w.id];
    return bal !== undefined && bal < 0;
  });

  // 2. İSG Belgesi Bitiş Tarihi yaklaşanlar ve dolanlar (Son 15 gün veya geçmiş)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isgMapped = workers.filter(w => !!w.isg_bitis_tarihi).map(w => {
    const endDate = new Date(w.isg_bitis_tarihi);
    endDate.setHours(0, 0, 0, 0);
    const timeDiff = endDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return { ...w, remainingDays: dayDiff };
  });

  // Split into Expired and Approaching
  const allIsgExpiredWorkers = isgMapped.filter(w => w.remainingDays <= 0);
  const allIsgApproachingWorkers = isgMapped
    .filter(w => w.remainingDays > 0 && w.remainingDays <= 15)
    .sort((a, b) => a.remainingDays - b.remainingDays); // Sort ascending (least days remaining first)

  // Filter lists by worker name search query
  const filterByName = (w) => w.full_name.toLowerCase().includes(searchName.toLowerCase());

  const negativeBalanceWorkers = allNegativeBalanceWorkers.filter(filterByName);
  const isgExpiredWorkers = allIsgExpiredWorkers.filter(filterByName);
  const isgApproachingWorkers = allIsgApproachingWorkers.filter(filterByName);

  if (allNegativeBalanceWorkers.length === 0 && allIsgExpiredWorkers.length === 0 && allIsgApproachingWorkers.length === 0) {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}>🛡️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
              {t('anomalies.no_anomaly_title', 'Sistem Anomalisi Yok')}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('anomalies.no_anomaly_desc', 'Tüm finansal durumlar ve İSG sertifikaları güncel.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayedBalance = negativeBalanceWorkers.slice(0, 10);
  const displayedExpired = isgExpiredWorkers.slice(0, 10);
  const displayedApproaching = isgApproachingWorkers.slice(0, 10);

  const isEmpty = 
    (activeTab === 'all' && negativeBalanceWorkers.length === 0 && isgExpiredWorkers.length === 0 && isgApproachingWorkers.length === 0) ||
    (activeTab === 'balance' && negativeBalanceWorkers.length === 0) ||
    (activeTab === 'expired' && isgExpiredWorkers.length === 0) ||
    (activeTab === 'approaching' && isgApproachingWorkers.length === 0);

  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="anomaly-panel-container glass-card">
      {/* Search Input */}
      <div>
        <input 
          type="text" 
          className="form-input" 
          placeholder={t('filters.search_anomalies', 'Anomalilerde ara (İsim)...')} 
          value={searchName} 
          onChange={e => setSearchName(e.target.value)} 
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            background: 'transparent', border: 'none', color: activeTab === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: '600', paddingBottom: '0.25rem',
            borderBottom: activeTab === 'all' ? '2px solid var(--accent)' : 'none', fontSize: '0.8rem'
          }}
        >
          {t('filters.tab_all', 'Hepsi')} ({negativeBalanceWorkers.length + isgExpiredWorkers.length + isgApproachingWorkers.length})
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          style={{
            background: 'transparent', border: 'none', color: activeTab === 'balance' ? 'var(--text-main)' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: '600', paddingBottom: '0.25rem',
            borderBottom: activeTab === 'balance' ? '2px solid #ef4444' : 'none', fontSize: '0.8rem'
          }}
        >
          {t('filters.tab_low_balance', 'Düşük Bakiye')} ({negativeBalanceWorkers.length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          style={{
            background: 'transparent', border: 'none', color: activeTab === 'expired' ? 'var(--text-main)' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: '600', paddingBottom: '0.25rem',
            borderBottom: activeTab === 'expired' ? '2px solid #ef4444' : 'none', fontSize: '0.8rem'
          }}
        >
          {t('filters.tab_expired_hse', 'İSG Dolanlar')} ({isgExpiredWorkers.length})
        </button>
        <button
          onClick={() => setActiveTab('approaching')}
          style={{
            background: 'transparent', border: 'none', color: activeTab === 'approaching' ? 'var(--text-main)' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: '600', paddingBottom: '0.25rem',
            borderBottom: activeTab === 'approaching' ? '2px solid #f59e0b' : 'none', fontSize: '0.8rem'
          }}
        >
          {t('filters.tab_expiring_hse', 'İSG Yaklaşanlar')} ({isgApproachingWorkers.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {searchName ? t('anomalies.search_no_results', 'Arama kriterlerine uygun sonuç bulunamadı.') : t('anomalies.no_results', 'Sonuç bulunamadı.')}
          </div>
        ) : (
          <>
            {/* Negatif Bakiye Uyarıları */}
            {(activeTab === 'all' || activeTab === 'balance') && negativeBalanceWorkers.length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>⚠️</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>
                    {t('anomalies.financial_warnings_title', 'Finansal Uyarılar')} ({negativeBalanceWorkers.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {displayedBalance.map(w => (
                    <div 
                      key={w.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#fca5a5' }}>{w.full_name}</span>
                      <span style={{ fontWeight: '700', color: '#ef4444' }}>
                        {formatCurrency(balances[w.id], i18n.language)}
                      </span>
                    </div>
                  ))}
                  {negativeBalanceWorkers.length > 10 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                      {t('anomalies.more_people', 've {{count}} kişi daha...', { count: negativeBalanceWorkers.length - 10 })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* İSG Süresi Dolanlar */}
            {(activeTab === 'all' || activeTab === 'expired') && isgExpiredWorkers.length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>🪖</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>
                    {t('anomalies.hse_expired_title', 'İSG Süresi Dolanlar')} ({isgExpiredWorkers.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {displayedExpired.map(w => (
                    <div 
                      key={w.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#fca5a5' }}>{w.full_name}</span>
                      <span style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.85rem' }}>
                        {t('anomalies.hse_expired_badge', 'SÜRESİ DOLDU!')} ({w.isg_bitis_tarihi})
                      </span>
                    </div>
                  ))}
                  {isgExpiredWorkers.length > 10 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                      {t('anomalies.more_people', 've {{count}} kişi daha...', { count: isgExpiredWorkers.length - 10 })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* İSG Süresi Yaklaşanlar */}
            {(activeTab === 'all' || activeTab === 'approaching') && isgApproachingWorkers.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>🪖</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#f59e0b' }}>
                    {t('anomalies.hse_expiring_title', 'İSG Süresi Yaklaşanlar')} ({isgApproachingWorkers.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {displayedApproaching.map(w => (
                    <div 
                      key={w.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#fde68a' }}>{w.full_name}</span>
                      <span style={{ fontWeight: '700', color: '#f59e0b', fontSize: '0.85rem' }}>
                        {w.remainingDays} {t('anomalies.days_left', 'gün kaldı')}
                      </span>
                    </div>
                  ))}
                  {isgApproachingWorkers.length > 10 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                      {t('anomalies.more_people', 've {{count}} kişi daha...', { count: isgApproachingWorkers.length - 10 })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnomalyPanel;
