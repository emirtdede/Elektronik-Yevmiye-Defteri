import React from 'react';

const AnomalyPanel = ({ workers, balances }) => {
  // 1. Eksi bakiyeli işçiler (Çok fazla avans almışlar)
  const negativeBalanceWorkers = workers.filter(w => {
    const bal = balances[w.id];
    return bal !== undefined && bal < 0;
  });

  // 2. Uzun süredir işlem görmeyen aktif personeller (Son 30 gün)
  // Not: Bu bilgi şu an frontend'de mevcut değil, ileride genişletilebilir.
  // Şimdilik sadece eksi bakiyeye odaklanıyoruz.

  if (negativeBalanceWorkers.length === 0) {
    return null; // Hiç anomali yoksa panel gösterilmez
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Negatif Bakiye Uyarıları */}
      {negativeBalanceWorkers.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem'
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
              Sistem Uyarıları — Eksi Bakiyeli Personeller ({negativeBalanceWorkers.length})
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
    </div>
  );
};

export default AnomalyPanel;
