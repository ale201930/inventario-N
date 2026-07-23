'use client';

import { useState, useEffect } from 'react';

export default function ProductCard({ product, onSelect, onAddToCart, isPos = false, bcvRate }) {
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

  const isOutOfStock = product.stock_actual <= 0;
  const isLowStock = product.stock_actual <= product.stock_minimo && !isOutOfStock;

  const precioUsd = Number(product.precio_venta || 0);
  const precioBs = currentRate ? precioUsd * Number(currentRate) : null;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '12px' }}>
      {/* Product Image Thumbnail */}
      <div 
        onClick={() => onSelect && onSelect(product)}
        style={{
          width: '100%',
          height: '135px',
          background: '#f8fafc',
          position: 'relative',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {product.imagen_url ? (
          <img 
            src={product.imagen_url} 
            alt={product.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Sin Imagen</div>
          </div>
        )}

        {/* Stock Badge Overlay (Hidden in Sales module) */}
        {!isPos && (
          <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
            {isOutOfStock ? (
              <span className="badge badge-danger" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>Agotado</span>
            ) : isLowStock ? (
              <span className="badge badge-warning" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>Stock: {product.stock_actual}</span>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>Stock: {product.stock_actual}</span>
            )}
          </div>
        )}

        {/* Barcode Overlay */}
        <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', padding: '1px 6px', borderRadius: '50px', fontSize: '0.65rem', color: '#0f172a', fontWeight: 700, border: '1px solid #dbeafe' }}>
          {product.codigo_barras}
        </div>
      </div>

      {/* Product Details */}
      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem', letterSpacing: '0.04em' }}>
            {product.categoria_nombre || 'General'}
          </div>
          <h3 
            onClick={() => onSelect && onSelect(product)}
            style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.25 }}
          >
            {product.nombre}
          </h3>
        </div>

        {/* Dual Currency Price ($ and Bs.) */}
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eff6ff', paddingTop: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
              ${precioUsd.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>
              {precioBs !== null ? `Bs. ${precioBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Cargando Bs...'}
            </div>
          </div>

          {isPos ? (
            <button 
              disabled={isOutOfStock}
              onClick={() => onAddToCart && onAddToCart(product)}
              className={`btn ${isOutOfStock ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              {isOutOfStock ? 'Sin Stock' : '+ Agregar'}
            </button>
          ) : (
            <button 
              onClick={() => onSelect && onSelect(product)}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              Ver Detalle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
