import React from 'react';
import { useTranslation } from 'react-i18next';

const GuideDrawer = ({ 
  isOpen, 
  onClose, 
  title, 
  desc, 
  h1, 
  p1, 
  h2, 
  p2, 
  h3, 
  p3 
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div 
      className="drawer-overlay" 
      style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        zIndex: 9999, 
        display: 'flex', 
        justifyContent: 'flex-end',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(15, 23, 42, 0.6)'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-card" 
        style={{ 
          width: '100%', 
          maxWidth: '440px', 
          height: '100%', 
          borderRadius: '20px 0 0 20px', 
          padding: '2.5rem 2rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          background: 'var(--option-bg, #0f172a)',
          borderLeft: '1px solid var(--glass-border)',
          animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 {title}
          </h3>
          <button 
            className="btn btn-close"
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '4px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
            {desc}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {h1 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '0.4rem', marginTop: 0 }}>
                  {h1}
                </h4>
                {p1 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {p1}
                  </p>
                )}
              </div>
            )}
            
            {h2 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '0.4rem', marginTop: 0 }}>
                  {h2}
                </h4>
                {p2 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {p2}
                  </p>
                )}
              </div>
            )}
            
            {h3 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '0.4rem', marginTop: 0 }}>
                  {h3}
                </h4>
                {p3 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {p3}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideDrawer;
