'use client';

import { useState, useEffect } from 'react';

// Global Event Emitter for Toast Notifications
let toastListener = null;
let confirmListener = null;

export function showToast(message, type = 'info', duration = 3500) {
  if (toastListener) {
    queueMicrotask(() => {
      if (toastListener) {
        toastListener({ id: Date.now() + Math.random(), message, type, duration });
      }
    });
  }
}

export function showConfirm({ title = '¿Confirmar Acción?', message = '¿Estás seguro de proceder?', onConfirm, onCancel }) {
  if (confirmListener) {
    queueMicrotask(() => {
      if (confirmListener) {
        confirmListener({ title, message, onConfirm, onCancel });
      }
    });
  } else if (onConfirm) {
    if (window.confirm(message)) onConfirm();
  }
}

export default function CustomNotificationProvider() {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    toastListener = (newToast) => {
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration);
    };

    confirmListener = (dialogData) => {
      setConfirmDialog(dialogData);
    };

    return () => {
      toastListener = null;
      confirmListener = null;
    };
  }, []);

  const handleConfirmAction = () => {
    if (confirmDialog && confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog(null);
  };

  const handleCancelAction = () => {
    if (confirmDialog && confirmDialog.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  return (
    <>
      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          let bg = '#ffffff';
          let color = '#1e1b4b';
          let border = '#e9d5ff';

          if (toast.type === 'success') {
            bg = '#ecfdf5';
            color = '#059669';
            border = '#a7f3d0';
          } else if (toast.type === 'error') {
            bg = '#fff1f2';
            color = '#e11d48';
            border = '#fecdd3';
          } else if (toast.type === 'warning') {
            bg = '#fffbe6';
            color = '#d97706';
            border = '#fef3c7';
          }

          return (
            <div 
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                color: color,
                padding: '0.9rem 1.2rem',
                borderRadius: '50px',
                boxShadow: '0 10px 30px rgba(124, 58, 237, 0.12)',
                border: `1px solid ${border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <span style={{ flex: 1 }}>{toast.message}</span>
            </div>
          );
        })}
      </div>

      {/* Custom Confirmation Modal Dialog */}
      {confirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(30, 27, 75, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '1.75rem', background: '#ffffff', border: '1px solid #e9d5ff', animation: 'scaleUp 0.25s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '0.6rem' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={handleCancelAction} 
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmAction} 
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #e11d48, #be123c)', border: 'none' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
