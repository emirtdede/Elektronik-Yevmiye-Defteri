import React from 'react';

const AnomalyPanel = ({ workers, balances }) => {
  // 1. Eksi bakiyeli işçiler (Çok fazla avans almışlar)
  const negativeBalanceWorkers = workers.filter(w => {
    const bal = balances[w.id];
    return bal !== undefined && bal < 0;
  });

  // 2. İSG Belgesi Bitiş Tarihi yaklaşanlar (Son 15 gün veya süresi geçmiş)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isgWarningWorkers = workers.filter(w => {
    if (!w.isg_bitis_tarihi) return false;
    const endDate = new Date(w.isg_bitis_tarihi);
    endDate.setHours(0, 0, 0, 0);
    const timeDiff = endDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return dayDiff <= 15;
  }).map(w => {
    const endDate = new Date(w.isg_bitis_tarihi);
    endDate.setHours(0, 0, 0, 0);
    const timeDiff = endDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return { ...w, remainingDays: dayDiff };
  });

  if (negativeBalanceWorkers.length === 0 && isgWarningWorkers.length === 0) {
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
              Sistem Anomalisi Yok
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tüm finansal durumlar ve İSG sertifikaları güncel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Negatif Bakiye Uyarıları */}
      {negativeBalanceWorkers.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '0.75rem'
          }}>
            <span style={{ 
              fontSize: '1.5rem', 
              display: 'flex', 
              alignItems: 'center' 
            }}>⚠️</span>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#ef4444' 
            }}>
              Finansal Uyarılar — Eksi Bakiyeli Personeller ({negativeBalanceWorkers.length})
            </h3>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem' 
          }}>
            {negativeBalanceWorkers.map(w => (
              <div 
                key={w.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.9rem'
                }}
              >
                <span style={{ fontWeight: '600', color: '#fca5a5' }}>{w.full_name}</span>
                <span style={{ 
                  fontWeight: '700', 
                  color: '#ef4444',
                  fontSize: '0.95rem'
                }}>
                  {balances[w.id]} ₺
                </span>
              </div>
            ))}
          </div>
          <p style={{ 
            margin: '0.75rem 0 0 0', 
            fontSize: '0.8rem', 
            color: '#94a3b8',
            fontStyle: 'italic'
          }}>
            Bu personellerin aldıkları avanslar, hak edişlerini aşmıştır. Detaylar için ilgili personelin profiline gidin.
          </p>
        </div>
      )}

      {/* İSG Belgesi Uyarıları */}
      {isgWarningWorkers.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '0.75rem'
          }}>
            <span style={{ 
              fontSize: '1.5rem', 
              display: 'flex', 
              alignItems: 'center' 
            }}>🪖</span>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#f59e0b' 
            }}>
              İSG Uyarıları — Belge Süresi Yaklaşanlar / Dolanlar ({isgWarningWorkers.length})
            </h3>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem' 
          }}>
            {isgWarningWorkers.map(w => {
              const isExpired = w.remainingDays < 0;
              return (
                <div 
                  key={w.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: isExpired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: isExpired ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ fontWeight: '600', color: isExpired ? '#fca5a5' : '#fde68a' }}>{w.full_name}</span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: isExpired ? '#ef4444' : '#f59e0b',
                    fontSize: '0.85rem'
                  }}>
                    {isExpired ? 'SÜRESİ DOLDU!' : `${w.remainingDays} gün kaldı`}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ 
            margin: '0.75rem 0 0 0', 
            fontSize: '0.8rem', 
            color: '#94a3b8',
            fontStyle: 'italic'
          }}>
            Yukarıdaki personellerin İSG eğitim/sertifika geçerlilik süreleri 15 günden az kalmış veya dolmuştur. Yenileme işlemlerini başlatınız.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnomalyPanel;
