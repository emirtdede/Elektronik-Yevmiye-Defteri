import React from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = "danger" }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ width: '400px', maxWidth: '90%', animation: 'fadeIn 0.3s ease', background: 'var(--spotlight-bg)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: type === 'danger' ? 'var(--danger-text)' : 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {type === 'danger' && '⚠️'} {title}
          </h3>
          
          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            {cancelText !== "" && (
              <button 
                className="btn" 
                onClick={onClose}
                style={{ background: 'transparent' }}
              >
                {cancelText || t('common.cancel')}
              </button>
            )}
            <button 
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
              onClick={() => {
                onConfirm && onConfirm();
                onClose();
              }}
            >
              {confirmText || (type === 'danger' ? t('common.delete') : t('common.confirm'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
