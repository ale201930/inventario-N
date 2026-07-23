'use client';

import { useState, useEffect } from 'react';

export default function ProductModal({ product, onClose, bcvRate }) {
  const [currentRate, setCurrentRate] = useState(bcvRate || null);

  useEffect(() => {
    if (bcvRate) {
      setCurrentRate(bcvRate);
    } else {
      fetch('/api/bcv')
        .then(res => res.json())
        .then(data => {
          if (data && data.promedio) setCurrentRate(data.promedio);
        })
        .catch(() => {});
    }
  }, [bcvRate]);

  if (!product) return null;

  const precioUsd = Number(product.precio_venta || 0);
  const precioBs = currentRate ? precioUsd * Number(currentRate) : null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', position: 'relative', background: '#ffffff', border: '1px solid #dbeafe' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          ✕
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
          
          {/* High Resolution Image View */}
          <div style={{ background: '#f8fafc', border: '1px solid #dbeafe', borderRadius: '16px', overflow: 'hidden', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.imagen_url ? (
              <img 
                src={product.imagen_url} 
                alt={product.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '350px' }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontWeight: 600 }}>Sin imagen disponible</div>
              </div>
            )}
          </div>

          {/* Detailed Info */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
                {product.categoria_nombre || 'Sin Categoría'}
              </span>
              <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>{product.nombre}</h2>
              <div style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
                {product.descripcion || 'Sin descripción adicional disponible.'}
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #dbeafe', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Código de Barras:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{product.codigo_barras}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Stock Actual:</span>
                  <span style={{ fontWeight: 700, color: product.stock_actual <= product.stock_minimo ? '#d97706' : '#059669' }}>
                    {product.stock_actual} unidades
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Umbral Stock Mínimo:</span>
                  <span style={{ fontWeight: 600 }}>{product.stock_minimo} unidades</span>
                </div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase' }}>
                  PRECIO DE VENTA OFICIAL
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
                  ${precioUsd.toFixed(2)} USD
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                  {precioBs !== null ? `Bs. ${precioBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Cargando Bs...'}
                </div>
              </div>
            </div>

            <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem' }}>
              Cerrar Vista
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
